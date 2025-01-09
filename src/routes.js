import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import s3 from "./s3Client.js";
import db from "./database.js";
import crypto from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  generateRandomFilename,
  validateFileUpload,
} from "./utils/fileUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function routes(app) {
  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    ban: 1,
    onBan: async (request) => {
      await db.run("INSERT INTO blacklist (ip, reason) VALUES (?, ?)", [
        request.ip,
        "Rate limit exceeded",
      ]);
    },
  });

  app.get("/", (_, reply) => {
    reply.redirect("https://slop.sh");
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "static"),
    prefix: "/",
  });

  app.register(multipart);

  app.post("/upload", async (request, reply) => {
    try {
      const apiKey = request.headers["x-api-key"];
      if (!apiKey) {
        return reply.status(403).send({ error: "API key required" });
      }

      const apiKeyExists = await db.get(
        "SELECT 1 FROM api_keys WHERE api_key = ?",
        [apiKey],
      );
      if (!apiKeyExists) {
        return reply.status(403).send({ error: "Invalid API key" });
      }

      const data = await request.file();
      validateFileUpload(data);
      const fileBuffer = await data.toBuffer();
      const randomFileName = generateRandomFilename(data.filename);
      const bucketName = process.env.BUCKET_NAME;
      const s3Key = randomFileName;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: data.mimetype,
          ACL: "public-read",
        }),
      );

      const deleteKey = crypto.randomBytes(16).toString("hex");
      const deleteUrl = `http://localhost:6969/delete?key=${deleteKey}`;
      await db.run(
        "INSERT INTO uploads (ip, filename, delete_key) VALUES (?, ?, ?)",
        [request.ip, s3Key, deleteKey],
      );

      const fileUrl = `https://r2.slop.sh/${s3Key}`;
      reply.send({ url: fileUrl, deleteUrl });
    } catch (err) {
      app.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.get("/delete", async (request, reply) => {
    try {
      const deleteKey = request.query.key;
      if (!deleteKey) {
        return reply.status(400).send({ error: "Delete key required" });
      }

      const upload = await db.get(
        "SELECT filename FROM uploads WHERE delete_key = ?",
        [deleteKey],
      );
      if (!upload) {
        return reply.status(404).send({ error: "Invalid delete key" });
      }

      const bucketName = process.env.BUCKET_NAME;
      const s3Key = upload.filename;

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        }),
      );

      await db.run("DELETE FROM uploads WHERE delete_key = ?", [deleteKey]);
      reply.send({ success: true, message: "File deleted successfully" });
    } catch (err) {
      app.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });
}

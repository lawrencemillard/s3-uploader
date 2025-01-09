import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import s3 from "./s3Client.js";
import db from "./database.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
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

      await db.run("INSERT INTO uploads (ip, filename) VALUES (?, ?)", [
        request.ip,
        s3Key,
      ]);

      const fileUrl = `https://r2.slop.sh/${s3Key}`;
      reply.send({ link: fileUrl });
    } catch (err) {
      if (
        err.message.includes("Invalid file type") ||
        err.message.includes("File size exceeds limit")
      ) {
        reply.status(400).send({ error: err.message });
      } else {
        app.log.error(err);
        reply.status(500).send({ error: "An unexpected error occurred" });
      }
    }
  });
}

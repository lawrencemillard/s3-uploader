import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import s3 from "./s3Client.js";
import db from "./database.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function generateRandomFilename(originalFilename) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomPart = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
  const extension = path.extname(originalFilename);
  return `${randomPart}${extension}`;
}

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
      const data = await request.file();
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
      app.log.error(err);
      reply.status(500).send({ error: err.message });
    }
  });
}

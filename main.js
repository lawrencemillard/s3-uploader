import fastify from "fastify";
import path from "path";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname } from "path";
import multipart from "@fastify/multipart";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fastifyRateLimit from "@fastify/rate-limit";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = fastify({ logger: true });

const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        filename TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

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

const start = async () => {
  try {
    await app.listen({ port: 6969 });
    console.log(`Server is running on http://localhost:6969`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

app.register(multipart);

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function generateRandomFilename(originalFilename) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomPart = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
  const extension = path.extname(originalFilename);
  return `${randomPart}${extension}`;
}

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
      })
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

start();

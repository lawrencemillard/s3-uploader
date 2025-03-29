import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = [
  "AWS_REGION",
  "S3_ENDPOINT",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "BUCKET_NAME",
  "PUBLIC_URL",
];

requiredEnvVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
});

export default {
  server: {
    port: process.env.PORT || 6969,
    host: process.env.HOST || "localhost",
  },
  aws: {
    region: process.env.AWS_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    bucket: process.env.BUCKET_NAME,
  },
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ["image", "video", "application"],
  },
  rateLimit: {
    max: 100,
    timeWindow: "1 minute",
  },
  publicUrl: process.env.PUBLIC_URL,
  logger: {
    file: process.env.LOG_FILE || "logs/s3.log",
  },
};

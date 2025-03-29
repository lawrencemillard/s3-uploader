import path from "path";
import config from "../config.js";

export function generateRandomFilename(originalFilename) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomPart = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
  const extension = path.extname(originalFilename);
  return `${randomPart}${extension}`;
}

export function validateFileUpload(data) {
  const { allowedMimeTypes, maxFileSize } = config.upload;

  const mimeType = data.mimetype.split("/")[0];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Invalid file type");
  }

  if (data.file.length > maxFileSize) {
    throw new Error("File size exceeds limit");
  }
}

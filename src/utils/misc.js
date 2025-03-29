import fs from "fs";
import path from "path";

export function ensureDirsExist() {
  const staticDirPath = path.resolve(process.cwd(), "src/static");
  const logsDirPath = path.resolve(process.cwd(), "logs");

  if (!fs.existsSync(staticDirPath)) {
    fs.mkdirSync(staticDirPath, { recursive: true });
  }

  if (!fs.existsSync(logsDirPath)) {
    fs.mkdirSync(logsDirPath, { recursive: true });
  }
}

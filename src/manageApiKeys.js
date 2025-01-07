import sqlite3 from "sqlite3";
import { open } from "sqlite";
import crypto from "crypto";

const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

const generateApiKey = () => {
  return crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "0")
    .replace(/\//g, "0");
};

const createApiKey = async () => {
  const apiKey = generateApiKey();
  await db.run("INSERT INTO api_keys (api_key) VALUES (?)", [apiKey]);
  console.log(`API Key created: ${apiKey}`);
};

const listApiKeys = async () => {
  const keys = await db.all("SELECT id, api_key, timestamp FROM api_keys");
  console.table(keys);
};

const updateApiKey = async (id) => {
  const newApiKey = generateApiKey();
  const result = await db.run("UPDATE api_keys SET api_key = ? WHERE id = ?", [
    newApiKey,
    id,
  ]);
  if (result.changes > 0) {
    console.log(`API Key updated: ${newApiKey}`);
  } else {
    console.log(`API Key with id ${id} not found.`);
  }
};

const deleteApiKey = async (id) => {
  const result = await db.run("DELETE FROM api_keys WHERE id = ?", [id]);
  if (result.changes > 0) {
    console.log(`API Key with id ${id} deleted.`);
  } else {
    console.log(`API Key with id ${id} not found.`);
  }
};

if (process.argv.length < 3) {
  console.log("Usage: node src/manageApiKeys.js <command> [<args>]");
  console.log("Commands:");
  console.log("  create");
  console.log("  list");
  console.log("  update <id>");
  console.log("  delete <id>");
  process.exit(1);
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case "create":
    await createApiKey();
    break;
  case "list":
    await listApiKeys();
    break;
  case "update":
    if (!arg) {
      console.error("Please provide an API key id.");
      process.exit(1);
    }
    await updateApiKey(arg);
    break;
  case "delete":
    if (!arg) {
      console.error("Please provide an API key id.");
      process.exit(1);
    }
    await deleteApiKey(arg);
    break;
  default:
    console.error("Unknown command.");
    process.exit(1);
}

process.exit(0);

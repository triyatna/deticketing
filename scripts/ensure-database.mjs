import fs from "node:fs";
import path from "node:path";

const dbUrlRaw = String(process.env.DATABASE_URL || "").trim();
const dbUrl = dbUrlRaw || "file:./prisma/dev.db";

if (!dbUrl.startsWith("file:")) {
  process.exit(0);
}

const sqlitePathRaw = dbUrl.slice("file:".length).trim();
if (!sqlitePathRaw || sqlitePathRaw === ":memory:") {
  process.exit(0);
}

const sqlitePath = path.isAbsolute(sqlitePathRaw)
  ? sqlitePathRaw
  : path.resolve(process.cwd(), sqlitePathRaw);

const sqliteDir = path.dirname(sqlitePath);
if (!fs.existsSync(sqliteDir)) {
  fs.mkdirSync(sqliteDir, { recursive: true });
}

if (!fs.existsSync(sqlitePath)) {
  fs.closeSync(fs.openSync(sqlitePath, "a"));
}

if (!dbUrlRaw) {
  process.env.DATABASE_URL = dbUrl;
}


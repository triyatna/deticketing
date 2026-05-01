import fs from "node:fs";
import path from "node:path";

export const ensureDatabaseFile = () => {
  const dbUrlRaw = String(process.env.DATABASE_URL || "").trim();
  const dbUrl = dbUrlRaw || "file:./prisma/dev.db";

  if (!dbUrl.startsWith("file:")) {
    return dbUrl;
  }

  const sqlitePathRaw = dbUrl.slice("file:".length).trim();
  if (!sqlitePathRaw || sqlitePathRaw === ":memory:") {
    return dbUrl;
  }

  const sqlitePath = path.isAbsolute(sqlitePathRaw)
    ? sqlitePathRaw
    : path.resolve(process.cwd(), sqlitePathRaw);

  const sqliteDir = path.dirname(sqlitePath);
  if (!fs.existsSync(sqliteDir)) {
    fs.mkdirSync(sqliteDir, { recursive: true });
  }

  if (!fs.existsSync(sqlitePath)) {
    console.log(`Database belum ada, membuat file baru: ${sqlitePath}`);
    fs.closeSync(fs.openSync(sqlitePath, "a"));
  } else {
    console.log(`Database ditemukan di: ${sqlitePath}. Melewati inisialisasi file.`);
  }

  if (!dbUrlRaw) {
    process.env.DATABASE_URL = dbUrl;
  }

  return dbUrl;
};

ensureDatabaseFile();

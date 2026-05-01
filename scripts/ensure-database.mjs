import fs from "node:fs";
import path from "node:path";

export const ensureDatabaseFile = () => {
  const dbUrlRaw = String(process.env.DATABASE_URL || "").trim();
  
  // Jika URL sudah ada (dari env), kita pastikan path-nya siap
  if (dbUrlRaw && dbUrlRaw.startsWith("file:")) {
    const sqlitePathRaw = dbUrlRaw.slice("file:".length).trim();
    if (sqlitePathRaw && sqlitePathRaw !== ":memory:") {
      const sqlitePath = path.isAbsolute(sqlitePathRaw) ? sqlitePathRaw : path.resolve(process.cwd(), sqlitePathRaw);
      const sqliteDir = path.dirname(sqlitePath);
      if (!fs.existsSync(sqliteDir)) fs.mkdirSync(sqliteDir, { recursive: true });
      if (!fs.existsSync(sqlitePath)) {
        console.log(`Database (env) belum ada, membuat file: ${sqlitePath}`);
        fs.closeSync(fs.openSync(sqlitePath, "a"));
      } else {
        console.log(`Database (env) ditemukan di: ${sqlitePath}`);
      }
      return dbUrlRaw;
    }
  }

  // Jika tidak ada env, cari di lokasi kandidat (sama dengan server/utils/prisma.ts)
  const baseDirs = [process.cwd()];
  // Tambahkan /var/www jika di linux
  if (process.platform !== 'win32') baseDirs.push('/var/www/project/ticketing/deticketing');

  const candidates = baseDirs.flatMap(base => [
    path.resolve(base, "prisma", "dev.db"),
    path.resolve(base, "dev.db"),
    path.resolve(base, "data", "dev.db")
  ]);

  const foundPath = candidates.find(p => fs.existsSync(p));
  const targetPath = foundPath || path.resolve(process.cwd(), "prisma", "dev.db");
  const sqliteDir = path.dirname(targetPath);

  if (!fs.existsSync(sqliteDir)) fs.mkdirSync(sqliteDir, { recursive: true });
  if (!fs.existsSync(targetPath)) {
    console.log(`Database belum ada, membuat file baru: ${targetPath}`);
    fs.closeSync(fs.openSync(targetPath, "a"));
  } else {
    console.log(`Database ditemukan di: ${targetPath}. Melewati inisialisasi.`);
  }

  const finalUrl = `file:${targetPath}`;
  if (!dbUrlRaw) process.env.DATABASE_URL = finalUrl;
  return finalUrl;
};

ensureDatabaseFile();

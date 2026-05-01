import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "prisma/config";

const toPosixPath = (value: string) => value.replace(/\\/g, "/");

const ensureSqliteFileFromUrl = (url: string) => {
  if (!url.startsWith("file:")) return;

  const rawPath = url.slice("file:".length).trim();
  if (!rawPath || rawPath === ":memory:") return;

  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(resolvedPath)) {
    fs.closeSync(fs.openSync(resolvedPath, "a"));
  }
};

const resolveDatabaseUrl = () => {
  const fromEnv = String(process.env.DATABASE_URL || "").trim();
  if (fromEnv) {
    ensureSqliteFileFromUrl(fromEnv);
    return fromEnv.startsWith("file:") 
      ? `file:${toPosixPath(fromEnv.slice("file:".length))}`
      : fromEnv;
  }

  // Logika pencarian cerdas (Smart Search)
  const baseDirs = [process.cwd()];
  if (process.platform !== 'win32') baseDirs.push('/var/www/project/ticketing/deticketing');

  const candidates = baseDirs.flatMap(base => [
    path.resolve(base, "prisma", "dev.db"),
    path.resolve(base, "dev.db"),
    path.resolve(base, "data", "dev.db")
  ]);

  const foundPath = candidates.find(p => fs.existsSync(p));
  const targetPath = foundPath || path.resolve(process.cwd(), "prisma", "dev.db");
  
  const url = `file:${targetPath}`;
  ensureSqliteFileFromUrl(url);
  
  process.env.DATABASE_URL = url;
  return `file:${toPosixPath(targetPath)}`;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveDatabaseUrl(),
  },
});

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "@prisma/config";

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
  const fallback = "file:./prisma/dev.db";
  const url = fromEnv || fallback;

  ensureSqliteFileFromUrl(url);

  if (!fromEnv) {
    process.env.DATABASE_URL = url;
  }

  if (!url.startsWith("file:")) return url;
  return `file:${toPosixPath(url.slice("file:".length))}`;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveDatabaseUrl(),
  },
});

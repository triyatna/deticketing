import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCandidateBaseDirsForRuntime,
  getRuntimeDataDir,
} from "./runtimeSecrets";

export const normalizeDbUrl = (value: string) => {
  return String(value || "").trim();
};

const toPrismaFileUrl = (absolutePath: string) => {
  return `file:${path.resolve(absolutePath)}`;
};

export const resolveSqliteFilePath = (databaseUrl: string) => {
  const normalized = normalizeDbUrl(databaseUrl);
  if (!normalized.startsWith("file:")) return "";

  const rawPath = normalized.slice("file:".length).split("?")[0];
  if (!rawPath) return "";

  if (rawPath.startsWith("./") || rawPath.startsWith("../")) {
    return path.resolve(process.cwd(), rawPath);
  }

  if (/^[a-zA-Z]:[\\/]/.test(rawPath)) {
    return path.resolve(rawPath);
  }

  if (/^\/[a-zA-Z]:[\\/]/.test(rawPath)) {
    return path.resolve(rawPath.slice(1));
  }

  if (normalized.startsWith("file://") || normalized.startsWith("file:/")) {
    try {
      return fileURLToPath(normalized);
    } catch {
      // lanjut ke fallback
    }
  }

  if (rawPath.startsWith("/")) {
    return path.resolve(rawPath);
  }

  return path.resolve(process.cwd(), rawPath);
};

const ensureSqlitePathReady = (databaseUrl: string) => {
  const filePath = resolveSqliteFilePath(databaseUrl);
  if (!filePath) return;

  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const ensureDatabaseUrl = () => {
  const baseDirs = getCandidateBaseDirsForRuntime();

  const pathCandidates = baseDirs.flatMap((base) => [
    path.resolve(base, "prisma", "dev.db"),
    path.resolve(base, "dev.db"),
    path.resolve(base, "data", "dev.db"),
  ]);

  const existing = normalizeDbUrl(process.env.DATABASE_URL || "");

  if (existing) {
    ensureSqlitePathReady(existing);

    const sqlitePath = resolveSqliteFilePath(existing);

    if (sqlitePath) {
      const fallbackExisting = pathCandidates.find((candidatePath) =>
        fs.existsSync(candidatePath),
      );

      const chosenPath = fs.existsSync(sqlitePath)
        ? sqlitePath
        : fallbackExisting || sqlitePath;

      const absoluteUrl = toPrismaFileUrl(chosenPath);

      ensureSqlitePathReady(absoluteUrl);
      process.env.DATABASE_URL = absoluteUrl;

      return absoluteUrl;
    }

    return existing;
  }

  const foundPath = pathCandidates.find((candidatePath) =>
    fs.existsSync(candidatePath),
  );

  const fallbackPath = path.resolve(getRuntimeDataDir(), "dev.db");
  const targetPath = foundPath || fallbackPath;
  const resolved = toPrismaFileUrl(targetPath);

  process.env.DATABASE_URL = resolved;
  ensureSqlitePathReady(resolved);

  return resolved;
};

const dbUrl = ensureDatabaseUrl();

console.log(">>> PRISMA DATABASE CONNECTED TO:", dbUrl);
console.log(">>> PRISMA UTILS LOADED WITH LIBSQL ADAPTER <<<");

const adapter = new PrismaLibSql({
  url: dbUrl,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

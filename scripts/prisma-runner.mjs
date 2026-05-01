import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ensureDatabaseFile } from "./ensure-database.mjs";

ensureDatabaseFile();

process.env.JITI_CACHE = "0";

const prismaCliPath = path.resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
if (!fs.existsSync(prismaCliPath)) {
  console.error("Prisma CLI lokal tidak ditemukan. Jalankan `npm install` terlebih dahulu.");
  process.exit(1);
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Gunakan perintah prisma, contoh: node scripts/prisma-runner.mjs generate");
  process.exit(1);
}

const child = spawn(process.execPath, [prismaCliPath, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});


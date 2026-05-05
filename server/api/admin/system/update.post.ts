import { exec } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import path from "node:path";
import { verifyToken } from "../../../utils/jwt";
import prisma from "../../../utils/prisma";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  if (!token) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

  const decoded: any = verifyToken(token);
  if (!decoded) throw createError({ statusCode: 401, statusMessage: "Invalid token" });

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!admin || admin.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Hanya OWNER yang dapat update" });

  try {
    console.log("--- STARTING OPTIMIZED SMART UPDATE ---");

    await execAsync("git fetch origin main");

    const { stdout: diffOutput } = await execAsync(
      "git rev-list HEAD...origin/main --count",
    );

    if (diffOutput.trim() === "0") {
      return {
        success: true,
        message: "Aplikasi sudah berada di versi terbaru (Sudah up-to-date).",
      };
    }

    console.log("Changes detected. Forcing update...");
    const { stdout: resetStdout } = await execAsync(
      "git reset --hard origin/main",
    );
    console.log("Git Reset Output:", resetStdout);

    // 2. Pembersihan (Cleaning) folder lama (Hanya .nuxt, jangan hapus .output dulu agar server tetap jalan)
    console.log("Cleaning old build artifacts...");
    if (fs.existsSync(path.resolve(process.cwd(), ".nuxt"))) {
      fs.rmSync(path.resolve(process.cwd(), ".nuxt"), { recursive: true, force: true });
    }

    // 2.1 AUTOMATIC BACKUP BEFORE SYNC (Tetap dilakukan)
    try {
      console.log("Creating automatic pre-update backup...");
      const { resolveSqliteFilePath } = await import("../../../utils/prisma");
      const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
      const dbPath = resolveSqliteFilePath(dbUrl);

      if (dbPath && fs.existsSync(dbPath)) {
        const backupDir = path.resolve(process.cwd(), 'data', 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.resolve(backupDir, `backup_auto_pre_update_${timestamp}.db`);
        fs.copyFileSync(dbPath, backupPath);
        console.log(`Auto-backup created: ${backupPath}`);
      }
    } catch (bakErr) {
      console.error("Auto-backup failed:", bakErr);
    }

    // 3. Jalankan build di folder terpisah atau langsung
    // Agar tidak mengganggu server yang jalan, kita biarkan build menimpa file secara bertahap 
    // atau biarkan Nitro menangani penggantian file di .output
    console.log("Running full sync chain...");
    // Gunakan perintah build standar, Nitro biasanya cukup cerdas untuk mengganti file di .output di akhir proses
    const fullCommand = "npm install && npm run prisma:generate && npm run prisma:push && npm run build";
    const { stdout: syncStdout } = await execAsync(fullCommand);

    console.log("Sync Result:", syncStdout);

    // 3.1 Data Migration: Ensure the very first admin is always OWNER
    try {
      console.log("Running data migration for Owner role...");
      const prismaUtils = await import("../../../utils/prisma");
      const db = prismaUtils.default;
      const firstUser = await db.admin.findFirst({ orderBy: { createdAt: "asc" } });
      if (firstUser && firstUser.role !== "OWNER") {
        await db.admin.update({
          where: { id: firstUser.id },
          data: { role: "OWNER" },
        });
        console.log(`Promoted first user (${firstUser.username}) to OWNER.`);
      }

      if (firstUser) {
        const ownerName = firstUser.name || firstUser.username;
        await db.event.updateMany({
          where: { createdByName: null },
          data: { createdByName: ownerName },
        });
        console.log(`Backfilled createdByName for old events with owner: ${ownerName}`);
      }

    } catch (migErr) {
      console.error("Data migration error:", migErr);
    }

    // 4. Trigger Restart (Berikan jeda 2 detik agar response sempat terkirim)
    console.log("Update finished. Triggering restart in 2 seconds...");
    if (process.platform !== "win32") {
      // Untuk Linux (PM2)
      exec("(sleep 2 && pm2 reload all) &", (err) => {
        if (err) console.error("Gagal reload PM2:", err);
      });
    } else {
      // Untuk Windows/Local
      setTimeout(() => {
        console.log("Exiting for restart...");
        process.exit(0);
      }, 2000);
    }

    return {
      success: true,
      message:
        "Update berhasil! Sistem sedang melakukan restart otomatis untuk menerapkan perubahan.",
      details: syncStdout,
    };
  } catch (error: any) {
    console.error("Update Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal Update: ${error.message}`,
    });
  }
});

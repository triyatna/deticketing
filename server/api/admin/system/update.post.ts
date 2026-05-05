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

    // 4. Jalankan build di latar belakang (Background Process)
    // Kita tidak menggunakan 'await' di sini agar bisa langsung membalas ke browser
    console.log("Starting full sync chain in background...");
    const fullCommand = "npm install && npx prisma generate && npx prisma migrate deploy && npm run build";
    
    // Eksekusi tanpa await agar request tidak timeout
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Background Update Error:", error);
        return;
      }
      console.log("Background Update Success:", stdout);
      
      // Trigger Restart setelah build selesai
      console.log("Update finished in background. Triggering restart...");
      if (process.platform !== "win32") {
        exec("pm2 reload all");
      } else {
        setTimeout(() => process.exit(0), 1000);
      }
    });

    return {
      success: true,
      message: "Update telah dimulai di latar belakang. Proses build memerlukan waktu 1-3 menit. Anda dapat terus menggunakan dashboard, sistem akan melakukan restart otomatis setelah selesai.",
    };
  } catch (error: any) {
    console.error("Initialization Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal Memulai Update: ${error.message}`,
    });
  }
});

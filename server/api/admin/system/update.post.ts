import { exec } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import path from "node:path";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
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

    // 2. Pembersihan (Cleaning) folder build lama
    console.log("Cleaning old build artifacts...");
    const foldersToClean = [".output", ".nuxt"];
    for (const folder of foldersToClean) {
      const folderPath = path.resolve(process.cwd(), folder);
      if (fs.existsSync(folderPath)) {
        console.log(`Removing ${folder}...`);
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
    }

    // 3. Lanjutkan proses sisanya (Include DB Sync & Data Migration)
    console.log("Running full sync chain...");
    const fullCommand =
      "npm install && npm run prisma:push && npm run prisma:generate && npm run build";
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

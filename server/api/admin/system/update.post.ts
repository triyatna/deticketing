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

    // 3. Lanjutkan proses sisanya
    console.log("Running full sync chain...");
    const fullCommand =
      "npm install && npm run prisma:generate && npm run build";
    const { stdout: syncStdout } = await execAsync(fullCommand);

    console.log("Sync Result:", syncStdout);

    return {
      success: true,
      message: "Update berhasil! ",
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

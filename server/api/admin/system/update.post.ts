import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  try {
    console.log("--- STARTING OPTIMIZED SMART UPDATE ---");

    // 1. Jalankan git pull terlebih dahulu untuk mengecek perubahan
    const { stdout: gitStdout } = await execAsync("git pull origin main");
    console.log("Git Pull Output:", gitStdout);

    // Jika sudah versi terbaru, tidak perlu lanjut ke proses berat (install/build)
    if (gitStdout.includes("Already up to date")) {
      return {
        success: true,
        message: "Aplikasi sudah berada di versi terbaru (Sudah up-to-date).",
        details: gitStdout,
      };
    }

    // 2. Jika ada perubahan, lanjutkan proses sisanya
    console.log("Changes detected. Running full sync chain...");
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
    console.error("Smart Update Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Gagal Smart Update: ${error.message}`,
    });
  }
});

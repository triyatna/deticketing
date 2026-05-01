import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

process.env.PORT = process.env.PORT || "1933";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Auto-migrate database if needed
try {
  console.log("Checking database schema...");
  execSync("npm run prisma:push", { stdio: "inherit" });
} catch (error) {
  console.warn("Could not auto-migrate database. Make sure SQLite path is accessible.");
}

// Use dynamic import to load the compiled Nitro server
import("./.output/server/index.mjs").catch(err => {
  console.error("Failed to start server. Make sure you have run 'npm run build' first.");
  console.error(err);
  process.exit(1);
});

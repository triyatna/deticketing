process.env.PORT = process.env.PORT || "1933";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Use dynamic import to load the compiled Nitro server
import("./.output/server/index.mjs").catch(err => {
  console.error("Failed to start server. Make sure you have run 'npm run build' first.");
  console.error(err);
  process.exit(1);
});

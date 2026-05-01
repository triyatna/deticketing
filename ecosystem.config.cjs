const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "ticketing",
      cwd: path.resolve(__dirname),
      script: ".output/server/index.mjs",
      interpreter: "node",

      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      min_uptime: "10s",
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 1933,
      },
      env_production: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 1933,
      },

      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};

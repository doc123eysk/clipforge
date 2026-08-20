module.exports = {
  apps: [
    {
      name: "clipforge",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/clipforge",
      env: { NODE_ENV: "production", PORT: 3000 },
      max_memory_restart: "512M",
      error_file: "/var/log/clipforge/error.log",
      out_file: "/var/log/clipforge/out.log",
      merge_logs: true,
    },
    {
      name: "clipforge-worker",
      script: "node_modules/.bin/tsx",
      args: "worker.ts",
      cwd: "/var/www/clipforge",
      env: { NODE_ENV: "production" },
      max_memory_restart: "256M",
      error_file: "/var/log/clipforge/worker-error.log",
      out_file: "/var/log/clipforge/worker-out.log",
      merge_logs: true,
    },
  ],
};

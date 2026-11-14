/** PM2 ecosystem file – run with `pm2 start ecosystem.config.js` */
module.exports = {
  apps: [
    {
      name: 'khata-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '512M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};

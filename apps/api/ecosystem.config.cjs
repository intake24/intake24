module.exports = {
  apps: [
    {
      name: 'API',
      script: './dist/server.mjs',
      instances: 2,
      exec_mode: 'cluster',
      watch: ['./dist'],
      watch_delay: 1000,
    },
  ],
};

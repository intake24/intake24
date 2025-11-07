module.exports = {
  apps: [
    {
      name: 'API',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: ['./dist'],
      watch_delay: 1000,
    },
  ],
};

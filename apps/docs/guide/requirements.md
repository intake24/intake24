# Requirements

Source code is written in Typescript and can be flexibly deployed to various environments. Source code also provides ansible roles for deployment to Ubuntu-based OS.

Intake24 system has couple of main components:

## API Server

API Server requires [Node.js](https://nodejs.org) runtime and couple of backend services.

### Database

[PostgreSQL](https://www.postgresql.org) is used as database engine. For more information see [Database](/guide/database) section.

### Redis

[Redis](https://redis.io) is used for `cache` / `queue` (jobs management) / `rate-limit` / `session` services.

### PDF generation

[Puppeteer](https://github.com/puppeteer/puppeteer) is used for PDF generation (Feedback generation). Make sure OS has all necessary components to run headless Chrome if PDF rendering is required.

## Admin & Survey apps

Both Admin and Survey frontend applications are SPA (Single page application) written in [Vue.js](https://vuejs.org) framework and built with [Vite](https://vitejs.dev).

Both applications have identical build toolchain pipeline and can be deployed to:

1. Same domain site as API Server - if relative path is configured, API server automatically registers the routes to serve the application within its context. See [Configuration](/config/) section for more details.
2. Applications can be served directly by web server (Nginx, Apache). Or there are simple http server scripts to serve the applications. For different domain sites, CORS needs to be configured properly.
3. 3<sup>rd</sup> party providers like e.g. AWS S3, Heroku, Netlify etc.

:::tip
See [Vite](https://vitejs.dev) docs for more details how to deploy Vue.js applications.
:::

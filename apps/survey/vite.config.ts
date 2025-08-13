import childProcess from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import viteLegacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import mkcert from 'vite-plugin-mkcert';
import { VitePWA } from 'vite-plugin-pwa';
import vueDevToolsPlugin from 'vite-plugin-vue-devtools';
import vuetify from 'vite-plugin-vuetify';
import webfontDownload from 'vite-plugin-webfont-dl';

import { resolveCaptchaScript } from '../../packages/common/src/security';
import { colors } from '../../packages/common/src/theme';
import pkg from './package.json';

// Set build info for application
process.env.VITE_APP_BUILD_VERSION = pkg.version;
process.env.VITE_APP_BUILD_REVISION = childProcess
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();
process.env.VITE_APP_BUILD_DATE = new Date().toISOString();

export default defineConfig(({ mode }) => {
  const {
    API_HOST,
    BASE_URL: base = '/',
    OUTPUT_DIR: outDir = 'dist',
    PRODUCTION_SOURCE_MAP,
    DISABLE_PWA,
    EMPTY_OUT_DIR = 'true',
    DEV_HTTPS,
    DEV_MKCERT_PATH,
    LEGACY,
    VITE_APP_NAME: appName,
    VITE_CAPTCHA_PROVIDER: captchaProvider,
    VUE_DEV_TOOLS,
  } = loadEnv(mode, process.cwd(), '');

  const disablePwa = !!(DISABLE_PWA === 'true');
  const emptyOutDir = !!(EMPTY_OUT_DIR === 'true');
  const https = !!(DEV_HTTPS === 'true');
  const legacy = !!(LEGACY === 'true');
  const sourcemap = !!(PRODUCTION_SOURCE_MAP === 'true');
  const vueDevTools = !!(VUE_DEV_TOOLS === 'true');

  return {
    resolve: {
      alias: {
        '@intake24/survey': fileURLToPath(new URL('./src', import.meta.url)),
        '@intake24/common': fileURLToPath(new URL('../../packages/common/src', import.meta.url)),
        '@intake24/i18n': fileURLToPath(new URL('../../packages/i18n/src', import.meta.url)),
        '@intake24/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
      },
    },
    base,
    build: {
      emptyOutDir,
      outDir,
      sourcemap,
      rollupOptions: {
        output: {
          assetFileNames: ({ name }) => {
            let subDir = '';

            if (name?.match(/\.(woff2|ttf)$/))
              subDir = 'fonts/';
            else if (name?.match(/\.(jpe?g|png|svg)$/))
              subDir = 'imgs/';

            return `assets/${subDir}[name]-[hash][extname]`;
          },
          manualChunks: (id) => {
            if (id.includes('echarts'))
              return 'echarts';
          },
        },
      },
    },
    server: {
      port: 8200,
      host: '0.0.0.0',
      proxy: {
        '^/(api|images)': {
          target: API_HOST,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        styles: { configFile: 'src/scss/settings.scss' },
      }),
      VueI18nPlugin(),
      Components({
        resolvers: [IconsResolver()],
        directoryAsNamespace: true,
      }),
      Icons({ autoInstall: true, compiler: 'vue3' }),
      webfontDownload([
        'https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
      ]),
      legacy ? viteLegacy() : undefined,
      https ? mkcert({ savePath: DEV_MKCERT_PATH }) : undefined,
      vueDevTools ? vueDevToolsPlugin() : undefined,
      createHtmlPlugin({
        inject: {
          data: {
            title: appName,
            themeColor: colors.primary,
            captcha: resolveCaptchaScript(captchaProvider),
          },
        },
      }),
      VitePWA({
        disable: disablePwa,
        registerType: 'autoUpdate',
        includeAssets: [
          'icons/icon.svg',
          'icons/icon.ico',
          'icons/apple-touch-icon-180x180.png',
          'robots.txt',
        ],
        manifest: {
          id: '/',
          start_url: '/',
          name: appName,
          short_name: appName,
          description: pkg.description,
          theme_color: colors.primary,
          icons: [
            {
              src: 'icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4000000,
          globPatterns: ['**/*.{css,js,html,svg,png,webp,ico,txt,woff,woff2,ttf}'],
        },
      }),
    ].filter(Boolean),
    test: {
      globals: true,
      include: ['**/*.spec.?(c|m)[jt]s?(x)'],
      environment: 'jsdom',
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      setupFiles: ['./src/setup.ts'],
    },
  };
});

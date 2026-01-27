import { defineConfig } from 'vitepress';

import { description } from '../package.json';
import { links } from './links';
import { nav } from './nav';
import { sidebar } from './sidebar';

export default defineConfig({
  title: 'Intake24',
  description,
  lang: 'en',

  head: [
    ['meta', { name: 'theme-color', content: '#EE672D' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'icon', href: '/icons/icon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/icons/icon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'mask-icon', href: '/icons/icon.svg', type: 'image/svg+xml', color: '#FFFFFF' }],
  ],

  vite: { server: { port: 8400 } },

  themeConfig: {
    logo: '/icons/pwa-512x512.png',
    nav,
    search: {
      provider: 'algolia',
      options: {
        appId: 'JUDZMF6GV1',
        apiKey: 'b0cf60473c8b77d46acd0862161c7a15',
        indexName: 'intake24',
      },
    },
    sidebar,
    socialLinks: [
      { icon: 'github', link: links.gitHub },
    ],
  },

  cleanUrls: true,
  sitemap: {
    hostname: links.docs,
  },
});

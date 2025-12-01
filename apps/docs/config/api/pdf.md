# PDF

PDF generation is implemented using [puppeteer](https://pptr.dev).

## Puppeteer

### Headless

Puppeteer modes.

- object-path: `puppeteer.headless`
- dotenv var: `PUPPETEER_HEADLESS`
- type: `boolean | 'shell' | undefined`
- default: `undefined`

### Language

Default language to load the browser with.

- object-path: `puppeteer.lang`
- dotenv var: `PUPPETEER_LANG`
- type: `string | undefined`
- default: `undefined`

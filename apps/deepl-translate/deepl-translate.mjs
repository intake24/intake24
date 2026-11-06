import fs from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';

const apiKey = process.env.DEEPL_AUTH_KEY;

if (apiKey === undefined)
  throw new Error('Please set the DEEPL_AUTH_KEY environment variable');

const deepLRequestOptions = {
  host: 'api-free.deepl.com',
  port: 443,
  path: '/v2/translate',
  method: 'POST',
  headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
};

function replaceMessageTags(str) {
  return str.replace(/\{(.*?)\}/g, '<m id="$1"/>');
}

function restoreMessageTags(str) {
  return str.replace(/<m id="(.*?)"\/>/g, '{$1}');
}

async function deepLTranslate(text, source_lang, target_lang) {
  return new Promise((resolve, reject) => {
    const req = https.request(deepLRequestOptions, (res) => {
      const chunks = [];

      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(chunks.join(''));
          resolve(response.translations);
        }
        else {
          reject(new Error(`Unexpected HTTP status code: ${res.statusCode}`));
          console.error(chunks.join(''));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    const body = JSON.stringify({
      text,
      source_lang,
      target_lang,
      tag_handling: 'xml',
    });

    req.write(body);

    req.end();
  });
}

async function translateObject(obj, sourceLang, destLang) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      console.debug(`${key}: ${value}`);
      const tr = await deepLTranslate([
        replaceMessageTags(value),
      ], sourceLang, destLang);
      console.debug(restoreMessageTags(tr[0].text));
      result[key] = restoreMessageTags(tr[0].text);
    }
    else if (typeof value === 'object') {
      result[key] = await translateObject(value, sourceLang, destLang);
    }
    else {
      throw new TypeError(`Unexpected field type: ${key} has type ${typeof value}`);
    }
  }

  return result;
}

async function translateFile(sourcePath, destPath, sourceLang, destLang) {
  const json = JSON.parse(await fs.readFile(sourcePath, 'utf8'));

  if (typeof json !== 'object')
    throw new TypeError(`Expected a single object in file ${sourcePath}`);

  const translated = await translateObject(json, sourceLang, destLang);

  await fs.writeFile(destPath, JSON.stringify(translated, null, 2));
}

async function translateFiles(sourceDir, destDir, sourceLang, destLang) {
  const sourceStat = await fs.stat(sourceDir);
  const destStat = await fs.stat(destDir);

  if (!sourceStat.isDirectory())
    throw new Error(`${sourceDir} does not exist or is not a directory`);

  if (!destStat.isDirectory())
    throw new Error(`${destDir} does not exist or is not a directory`);

  const files = await fs.readdir(sourceDir);

  for (const fileName of files) {
    if (!fileName.endsWith('.json'))
      continue;

    const sourcePath = path.join(sourceDir, fileName);
    const destPath = path.join(destDir, fileName);

    await translateFile(sourcePath, destPath, sourceLang, destLang);
  }
}

const args = process.argv.slice(2);

if (args.length !== 4)
  throw new Error('Expected 4 arguments: sourceDir destDir sourceLang destLang');

translateFiles(args[0], args[1], args[2], args[3]);

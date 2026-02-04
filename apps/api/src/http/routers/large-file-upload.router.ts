import type { RequestHandler } from 'express';

import fsp from 'node:fs/promises';

import { FileStore } from '@tus/file-store';
import { Server as TusServer } from '@tus/server';
import { Router } from 'express';

import fsConfig from '@intake24/api/config/filesystem';
import ioc from '@intake24/api/ioc';

import { permission } from '../middleware';

export function createLargeFileUploadRouter(authMiddleware: RequestHandler[]): Router {
  const uploadPath = ioc.cradle.fsConfig.local.uploads;

  const tusServer = new TusServer({
    path: '/admin/large-file-upload',
    relativeLocation: true,
    datastore: new FileStore({
      directory: uploadPath,
    }),
    maxSize: fsConfig.maxChunkedUploadSize,
    async onIncomingRequest(_req, _uploadId) {
      // Don't allow uploads if free disk space below configured threshold

      const stats = await fsp.statfs(uploadPath);
      const freeSpace = stats.bavail * stats.bsize;

      if (freeSpace < fsConfig.lowDiskSpaceThreshold) {
        // Tus server excepts this format
        // eslint-disable-next-line no-throw-literal
        throw {
          status_code: 507,
          body: 'Insufficient Storage Space',
        };
      }
    },
  });

  const router = Router();

  // Workaround for a middleware conflict between Tus server and express-session 🤡
  //
  // The error occurs because srvx (used by @tus/server) calls res.end() with a callback function
  // as the first argument (e.g., res.end(() => {...})).
  // express-session overrides res.end() to handle async session saving, misinterpreting the callback as the "chunk" argument,
  // which must be a string, Buffer, or Uint8Array, causing a crash.

  router.use((req, res, next) => {
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any, callback?: () => void) {
      if (typeof chunk === 'function') {
      // Fix: Convert res.end(callback) to res.end(null, callback)
        callback = chunk;
        chunk = null;
      }
      return originalEnd.call(this, chunk, encoding, callback);
    };
    next();
  });

  router.options('/', (req, res) => {
    tusServer.handle(req, res);
  });

  router.use(authMiddleware);

  router.use(permission('upload-large-files'));

  router.all('*path', (req, res) => {
    tusServer.handle(req, res);
  });

  return router;
}

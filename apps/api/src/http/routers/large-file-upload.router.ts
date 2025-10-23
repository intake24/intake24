import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileStore } from '@tus/file-store';
import { Server as TusServer } from '@tus/server';
import { RequestHandler, Router } from 'express';
import { permission } from '../middleware';

export function createLargeFileUploadRouter(authMiddleware: RequestHandler[]): Router {
  const tempDir = path.join(os.tmpdir(), 'large-file-uploads');
  fs.mkdirSync(tempDir, { recursive: true });

  const tusServer = new TusServer({
    path: '/admin/large-file-upload',
    relativeLocation: true,
    datastore: new FileStore({
      directory: tempDir,
    }),
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

  router.all('*', (req, res) => {
    tusServer.handle(req, res);
  });

  return router;
}

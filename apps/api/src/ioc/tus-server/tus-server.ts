import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileStore } from '@tus/file-store';
import { Server } from '@tus/server';
import { IoC } from '../ioc';

export default function tusServer({
  // eslint-disable-next-line unused-imports/no-unused-vars
  fsConfig,
}: Pick<IoC, 'fsConfig'>) {
  const tempDir = path.join(os.tmpdir(), 'large-file-uploads');
  fs.mkdirSync(tempDir, { recursive: true });

  const tusServer = new Server({
    path: '/admin/large-file-upload',
    relativeLocation: true,
    datastore: new FileStore({
      directory: tempDir,
    }),
  });

  return tusServer;
}

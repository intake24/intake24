declare module 'remove-bom-stream' {
  import { Transform } from 'node:stream';

  function removeBomStream(): Transform;

  export = removeBomStream;
}

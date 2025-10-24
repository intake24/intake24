import emailBlaster from './email-blaster';

export * from './comms';
export * from './comms.service';
export { default as commsService } from './comms.service';
export * from './email-blaster';

export const commsProviders = {
  'email-blaster': emailBlaster,
};

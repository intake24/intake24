import type { FileSystemConfig, ServicesConfig } from '@intake24/api/config';
import filesystem from '@intake24/api/config/filesystem';
import services from '@intake24/api/config/services';
import type { ACLConfig } from '@intake24/common-backend';
import { aclConfig as acl } from '@intake24/common-backend';
import type { DatabaseConfig } from '@intake24/db';
import { databaseConfig as database } from '@intake24/db';

export type CLIConfig = {
  acl: ACLConfig;
  database: DatabaseConfig;
  filesystem: FileSystemConfig;
  services: ServicesConfig;
};

const config: CLIConfig = {
  acl,
  database,
  filesystem,
  services,
};

export default config;

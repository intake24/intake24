import type { ModelStatic } from 'sequelize';

import type Suite from './integration-suite';
import type { SecurableType } from '@intake24/common/security';
import type { Securable } from '@intake24/db';

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { faker } from '@faker-js/faker';
import { AsyncParser } from '@json2csv/node';
import { times } from 'lodash-es';
import sharp from 'sharp';

import ioc from '@intake24/api/ioc';
import { FAQ, FeedbackScheme, Language, Permission, Role, Survey, SurveyScheme, SystemLocale, User, UserSecurable } from '@intake24/db';

const { fsConfig } = ioc.cradle;

export type SetSecurableOptions = {
  userId?: string;
  securableId: string;
  securableType: SecurableType;
  action?: string[];
};

function util(suite: typeof Suite) {
  /**
   * Set permissions for a testing role
   *
   * @param {(string | string[])} perm
   * @returns {Promise<void>}
   */
  const setPermission = async (perm: string | string[], roleName = 'test-role'): Promise<void> => {
    const role = await Role.findOne({
      where: { name: roleName },
    });

    if (!role)
      throw new Error('Missing mock role.');

    const name = Array.isArray(perm)
      ? perm
      : [perm];

    const permissions = await Permission.findAll({
      where: { name },
    });

    if (name.length && name.length !== permissions.length)
      throw new Error('Missing mock permissions.');

    await role.$set('permissions', permissions);
  };

  /**
   * Set permissions for a testing user
   *
   * @param {(string | string[])} perm
   * @param {number} userId
   * @returns {Promise<void>}
   */
  const setUserPermission = async (perm: string | string[], userId: string): Promise<void> => {
    const user = await User.findByPk(userId);

    if (!user)
      throw new Error('Missing mock user.');

    const name = Array.isArray(perm)
      ? perm
      : [perm];

    const permissions = await Permission.findAll({
      where: { name },
    });

    if (name.length && name.length !== permissions.length)
      throw new Error('Missing mock permissions.');

    await user.$set('permissions', permissions);
  };

  const setSecurable = async (options: SetSecurableOptions): Promise<void> => {
    const userId = suite.data.system.user.id;

    const { action, ...rest } = options;

    await UserSecurable.destroy({
      where: { ...rest },
    });

    if (action?.length) {
      const securables = action.map(item => ({ userId, ...rest, action: item }));

      await UserSecurable.bulkCreate(securables);
    }
  };

  /**
   * Remove test user's securables and record ownership, which imply resource permissions
   */
  const clearSecurableAccess = async (): Promise<void> => {
    const userId = suite.data.system.user.id;

    await Promise.all([
      UserSecurable.destroy({
        where: { userId },
      }),
      ...[
        FAQ,
        FeedbackScheme,
        Language,
        SystemLocale,
        Survey,
        SurveyScheme,
      ].map(model =>
        (model as ModelStatic<Securable>).update({ ownerId: null }, {
          where: { ownerId: userId },
        })),
    ]);
    await ioc.cradle.adminUserService.flushACLCacheByUserId(userId);
  };

  return {
    setPermission,
    setUserPermission,
    setSecurable,
    clearSecurableAccess,
  };
}

export default util;

export type Util = ReturnType<typeof util>;

export async function generateImage(filename: string): Promise<string> {
  const filePath = path.resolve(fsConfig.local.downloads, filename);

  await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: faker.color.rgb(),
    },
  }).jpeg().toFile(filePath);

  return filePath;
}

export async function generateCSV(filename: string): Promise<string> {
  const filePath = path.resolve(fsConfig.local.downloads, filename);

  const fields = [
    'username',
    'password',
    'email',
    'name',
    'phone',
  ];

  const data = times(10, () => ({
    username: faker.internet.username(),
    password: faker.internet.password(),
    email: faker.internet.email(),
    name: faker.person.firstName(),
    phone: faker.phone.number(),
  }));

  const csv = await new AsyncParser({ fields }).parse(data).promise();
  await writeFile(filePath, csv, { encoding: 'utf-8' });

  return filePath;
}

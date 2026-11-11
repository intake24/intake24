import type { SecurableType } from '@intake24/common/security';
import type { Securable } from '@intake24/db';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { surveyRespondent } from '@intake24/common/security';
import { modelToResource } from '@intake24/common/util';
import { User, UserSecurable } from '@intake24/db';

export default (type: SecurableType) => () => {
  const resource = modelToResource(type);
  const permissions = [`${resource}:securables`];
  const emailPrefix = `u02-${type.toLowerCase()}-`;

  let url: string;
  let securableModel: Securable;

  let staff: User;
  let staffRespondent: User;
  let respondentId: string;
  let respondentEmail: string;

  const search = async (value: string) => {
    const { status, body } = await request(suite.app)
      .get(`${url}/users`)
      .query({ search: value })
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user);

    expect(status).toBe(200);
    return (body as { id: string }[]).map(({ id }) => id).sort();
  };

  const permissionNames = (user: User) => ioc.cradle.aclCache.getPermissions(user.id);

  beforeAll(async () => {
    securableModel = suite.data.system[type];
    url = `/api/admin/${resource}/${securableModel.id}/securables`;

    const { adminUserService, adminSurveyService } = ioc.cradle;
    const { Survey: survey } = suite.data.system;

    [staff, staffRespondent] = await Promise.all([
      adminUserService.create({ email: `${emailPrefix}staff@example.com`, password: undefined }),
      adminUserService.create({ email: `${emailPrefix}staff-respondent@example.com`, password: undefined }),
    ]);
    await suite.util.setUserPermission([
      `${resource}:read`,
      surveyRespondent(survey.slug),
    ], staffRespondent.id);

    respondentEmail = `${emailPrefix}respondent@example.com`;
    const alias = await adminSurveyService.createRespondent(survey, {
      username: `${emailPrefix}respondent`,
      password: 'testRespondentPassword',
    });
    respondentId = alias.userId;
    // createRespondent drops the email unless the survey stores personal identifiers
    await User.update({ email: respondentEmail }, {
      where: { id: respondentId },
    });

    await suite.util.setPermission(permissions);
  });

  afterAll(async () => {
    await securableModel.update({ ownerId: null });
  });

  describe('available users', () => {
    it('should only match exact email for non-admin users', async () => {
      expect(await search(emailPrefix)).toEqual([]);
      expect(await search(`${emailPrefix}STAFF@example.com`)).toEqual([staff.id]);
    });

    it('should not treat LIKE wildcards as patterns', async () => {
      expect(await search('%')).toEqual([]);
      expect(await search(`${emailPrefix}staff@example.co_`)).toEqual([]);
    });

    it('should exclude respondents but not staff who are also respondents', async () => {
      expect(await search(respondentEmail)).toEqual([]);
      expect(await search(`${emailPrefix}staff-respondent@example.com`)).toEqual([staffRespondent.id]);
    });

    it('should allow partial search without respondents for users:browse', async () => {
      await suite.util.setPermission([...permissions, 'users:browse']);

      expect(await search(emailPrefix)).toEqual([staff.id, staffRespondent.id].sort());
      expect(await search('%')).toEqual([]);

      await suite.util.setPermission(permissions);
    });
  });

  describe('owner', () => {
    it('should reject respondent as owner', async () => {
      const { status } = await request(suite.app)
        .post(`${url}/owner`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({ userId: respondentId });

      expect(status).toBe(400);
    });

    it('should set owner, who then holds the derived resource permission', async () => {
      const newOwner = await ioc.cradle.adminUserService.create({
        email: `${emailPrefix}owner@example.com`,
        password: undefined,
      });

      const { status } = await request(suite.app)
        .post(`${url}/owner`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({ userId: newOwner.id });

      expect(status).toBe(200);
      await securableModel.reload();
      expect(securableModel.ownerId).toBe(newOwner.id);
      expect(await permissionNames(newOwner)).toContain(resource);
    });
  });

  describe('update', () => {
    it('should return 404 for respondent', async () => {
      const { status } = await request(suite.app)
        .patch(`${url}/${respondentId}`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({
          actions: ['read'],
        });

      expect(status).toBe(404);
    });

    it('should accept respondent with securable access as staff', async () => {
      const { adminSurveyService, adminUserService } = ioc.cradle;
      const { userId } = await adminSurveyService.createRespondent(suite.data.system.Survey, {
        username: `${emailPrefix}respondent-staff`,
        password: 'testRespondentPassword',
      });
      await User.update({ email: `${emailPrefix}respondent-staff@example.com` }, {
        where: { id: userId },
      });
      await adminUserService.setSecurableActions(userId, { securableType: type, securableId: securableModel.id }, ['read']);

      const { status } = await request(suite.app)
        .patch(`${url}/${userId}`)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({
          actions: ['read', 'edit'],
        });

      expect(status).toBe(200);
    });
  });

  describe('store', () => {
    const store = (email: string) => request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .send({
        email,
        actions: ['read'],
      });

    it('should return 409 for respondent email', async () => {
      const { status, body } = await store(respondentEmail);

      expect(status).toBe(409);
      expect(body.errors).toContainAllKeys(['email']);
    });

    it('should grant access to existing staff user', async () => {
      const { status } = await store(`${emailPrefix}staff@example.com`);

      expect(status).toBe(201);

      const securables = await UserSecurable.findAll({
        where: { userId: staff.id, securableType: type, securableId: securableModel.id },
      });
      expect(securables.map(({ action }) => action)).toEqual(['read']);
    });
  });

  describe('destroy', () => {
    const destroy = () => request(suite.app)
      .delete(`${url}/${staff.id}`)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user);

    it('should keep derived resource permission when user owns a record of the type', async () => {
      const ownerId = securableModel.ownerId;
      await securableModel.update({ ownerId: staff.id });

      expect((await destroy()).status).toBe(204);
      expect(await permissionNames(staff)).toContain(resource);

      await Promise.all([
        securableModel.update({ ownerId }),
        ioc.cradle.adminUserService.setSecurableActions(staff.id, { securableType: type, securableId: securableModel.id }, ['read']),
      ]);
    });

    it('should remove access and derived resource permission with the last securable of the type', async () => {
      expect((await destroy()).status).toBe(204);

      const securables = await UserSecurable.count({
        where: { userId: staff.id, securableType: type },
      });
      expect(securables).toBe(0);
      expect(await permissionNames(staff)).not.toContain(resource);
    });
  });
};

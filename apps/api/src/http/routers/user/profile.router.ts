import type { FieldValidationError } from 'express-validator';
import { initServer } from '@ts-rest/express';
import { pick } from 'lodash';
import { contract } from '@intake24/common/contracts';
import { Survey, UserPassword } from '@intake24/db';
import { ForbiddenError, NotFoundError, ValidationError } from '../../errors';

export function profile() {
  return initServer().router(contract.user.profile, {
    updatePassword: async ({ body, req }) => {
      const { userId } = req.scope.cradle.user;
      const { passwordCurrent, password } = body;

      const userPassword = await UserPassword.findByPk(userId);

      if (
        !userPassword
        || !(await req.scope.cradle.authenticationService.verifyPassword(
          passwordCurrent,
          userPassword,
        ))
      ) {
        throw new ValidationError('Enter your current valid password.', {
          path: 'passwordCurrent',
        });
      }

      await req.scope.cradle.adminUserService.updatePassword(userId, password);

      return { status: 200, body: undefined };
    },
    getPhysicalData: async ({ query, req }) => {
      const { survey: slug } = query;
      const { userId } = req.scope.cradle.user;

      if (slug) {
        const survey = await Survey.findBySlug(slug, {
          attributes: ['id'],
          include: [{ association: 'feedbackScheme', attributes: ['id'] }],
        });
        if (!survey)
          throw new NotFoundError();

        if (!survey.feedbackScheme)
          throw new ForbiddenError();
      }

      const data = await req.scope.cradle.userService.getPhysicalData(userId);

      return { status: 200, body: data };
    },
    setPhysicalData: async ({ body, query, req }) => {
      const { survey: slug } = query;
      const { userId } = req.scope.cradle.user;

      if (slug) {
        const survey = await Survey.findBySlug(slug, {
          attributes: ['id'],
          include: [{ association: 'feedbackScheme', attributes: ['id', 'physicalDataFields'] }],
        });
        if (!survey)
          throw new NotFoundError();

        if (!survey.feedbackScheme)
          throw new ForbiddenError();

        const errors = survey.feedbackScheme.physicalDataFields.reduce<
          Partial<FieldValidationError>[]
        >((acc, item) => {
          if (body[item] === undefined || body[item] === null) {
            acc.push({
              path: item,
              msg: 'Physical parameter is required for feedback calculation',
            });
          }

          return acc;
        }, []);

        if (errors.length)
          throw new ValidationError('Missing physical data fields', errors);
      }

      const data = await req.scope.cradle.userService.setPhysicalData(
        userId,
        pick(body, [
          'sex',
          'birthdate',
          'weightKg',
          'heightCm',
          'physicalActivityLevelId',
          'weightTarget',
        ]),
      );

      return { status: 200, body: data };
    },
    submissions: async ({ query, req }) => {
      const { survey: slug } = query;
      const { userId } = req.scope.cradle.user;

      const submissions = await req.scope.cradle.surveyService.getSubmissions(slug, userId);

      return { status: 200, body: submissions };
    },
  });
}

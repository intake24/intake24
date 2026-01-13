/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const { QueryTypes } = queryInterface.sequelize;

      const schemes = await queryInterface.sequelize.query(`SELECT id, data_export FROM survey_schemes;`, {
        type: QueryTypes.SELECT,
        transaction,
      });

      for (const scheme of schemes) {
        const { id } = scheme;
        const dataExport = JSON.parse(scheme.data_export);

        if (!dataExport)
          continue;

        for (const section of dataExport) {
          switch (section.id) {
            case 'user': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'userId')
                  return { id: 'id', label: field.label };

                return field;
              });
              break;
            }
            case 'survey': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'surveyId')
                  return { id: 'id', label: field.label };

                return field;
              });
              break;
            }
            case 'submission': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'submissionId')
                  return { id: 'id', label: field.label };

                return field;
              });
              break;
            }
            case 'meal': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'mealId')
                  return { id: 'id', label: field.label };
                if (field.id === 'mealIndex')
                  return { id: 'index', label: field.label };

                return field;
              });
              break;
            }
            case 'food': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'foodId')
                  return { id: 'id', label: field.label };
                if (field.id === 'foodIndex')
                  return { id: 'index', label: field.label };

                return field;
              });
              break;
            }
            case 'portionSizes': {
              section.fields = section.fields.map((field) => {
                if (field.id === 'portionMethod')
                  return { id: 'method', label: field.label };

                return field;
              });
              break;
            }
          }
        }

        await queryInterface.sequelize.query(
          `UPDATE survey_schemes SET data_export = :dataExport WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, dataExport: JSON.stringify(dataExport) },
            transaction,
          },
        );
      }
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};

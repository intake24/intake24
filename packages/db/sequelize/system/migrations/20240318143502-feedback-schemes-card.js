import { nanoid } from 'nanoid';

export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const schemes = await queryInterface.sequelize.query(
        `SELECT id, cards, demographic_groups FROM feedback_schemes;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      for (const scheme of schemes) {
        const { id } = scheme;

        let cards = JSON.parse(scheme.cards);
        let demographicGroups = JSON.parse(scheme.demographic_groups);

        demographicGroups = demographicGroups.map(group => ({ ...group, type: 'character' }));
        cards = cards.map((card) => {
          const { characterType: image, ...rest } = card;
          if (card.type === 'character')
            return { image, ...rest };

          const { name, summary, description, ...rest2 } = rest;

          demographicGroups.push({
            id: nanoid(6),
            type: rest.type,
            age: null,
            height: null,
            weight: null,
            nutrientRuleType: 'range',
            nutrientTypeId: null,
            physicalActivityLevelId: null,
            sex: null,
            scaleSectors: [
              { name, summary, description, range: { start: 0, end: 1000000 }, sentiment: 'good' },
            ],
          });

          return { image: rest.type === 'nutrient-group' ? 'beef' : 'fruitVeg', ...rest2 };
        });

        await queryInterface.sequelize.query(
          `UPDATE feedback_schemes SET cards = :cards, demographic_groups = :demographicGroups WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: {
              id,
              cards: JSON.stringify(cards),
              demographicGroups: JSON.stringify(demographicGroups),
            },
            transaction,
          },
        );
      }
    }),

  down: () => {
    throw new Error('Down migration not implemented');
  },
};

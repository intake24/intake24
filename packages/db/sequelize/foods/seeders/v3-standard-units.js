import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const adminUrl
  = 'https://raw.githubusercontent.com/intake24/admin-frontend/master/src/js/explorer/constants/standard-units-en.js';

const baseUrl
  = 'https://raw.githubusercontent.com/intake24/survey-frontend/master/SurveyClient/src/main/java/uk/ac/ncl/openlab/intake24/client/survey/portionsize';
const baseFilename = 'StandardUnits_{locale}.properties';

const locales = ['en', 'en_AU', 'en_NZ', 'ar', 'da', 'pt'];
const addonLocales = locales.filter(locale => locale !== 'en');

async function fetchAdminStandardUnits() {
  return new Promise((resolve, reject) => {
    const filename = path.resolve('standard-units-en.js');

    const file = fs.createWriteStream(filename);
    https.get(adminUrl, (response) => {
      response.pipe(file);

      file
        .on('finish', () => {
          file.close();
          const units = require(filename)().reduce((acc, unit) => {
            acc[unit.id] = unit.name;
            return acc;
          }, {});
          fs.unlinkSync(filename);
          resolve(units);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  });
}

async function fetchSurveyStandardUnits(locale) {
  return new Promise((resolve, reject) => {
    const filename = baseFilename.replace('{locale}', locale);
    const url = `${baseUrl}/${filename}`;

    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);

      file
        .on('finish', () => {
          file.close();

          const fileMap = fs
            .readFileSync(filename, 'utf-8')
            .split(/\r?\n/)
            .filter(Boolean)
            .reduce((acc, line) => {
              const [keyType, value] = line.split('=').map(s => s.trim());

              const res = keyType.match(/^(?<key>.*?)_(?<type>estimate_in|how_many)$/);
              const { key, type } = res?.groups || {};

              if (!key || !type) {
                console.warn(`Invalid line: ${line}`);
                return acc;
              }

              if (!acc[key])
                acc[key] = {};

              acc[key][type] = value;
              return acc;
            }, {});

          fs.unlinkSync(path.resolve(filename));

          resolve(fileMap);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  });
}

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const adminUnits = await fetchAdminStandardUnits();
      const fileMaps = await Promise.all(locales.map(locale => fetchSurveyStandardUnits(locale)));
      const localeFileMap = fileMaps.reduce((acc, fileMap, index) => {
        const locale = locales[index];
        acc[locale] = fileMap;
        return acc;
      }, {});

      const standardUnits = Object.entries(localeFileMap.en)
        .map(([id, data]) => {
          const estimate_in = { en: data.estimate_in };
          const how_many = { en: data.how_many };

          for (const locale of addonLocales) {
            const rfcLocale = locale.replace('_', '-');
            if (estimate_in.en !== localeFileMap[locale][id].estimate_in)
              estimate_in[rfcLocale] = localeFileMap[locale][id].estimate_in;

            if (how_many.en !== localeFileMap[locale][id].how_many)
              how_many[rfcLocale] = localeFileMap[locale][id].how_many;
          }

          return {
            id,
            name: adminUnits[id] ?? '',
            estimate_in: JSON.stringify(estimate_in),
            how_many: JSON.stringify(how_many),
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      const created_at = new Date();
      const updated_at = created_at;
      const timestamps = { created_at, updated_at };

      await queryInterface.bulkInsert(
        'standard_units',
        standardUnits.map(standardUnit => ({ ...standardUnit, ...timestamps })),
        { transaction },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const standardUnits = await fetchSurveyStandardUnits('en');
      const id = Object.entries(standardUnits).map(([id]) => id);

      await queryInterface.sequelize.query(`DELETE FROM standard_units WHERE id IN (:id);`, {
        type: queryInterface.sequelize.QueryTypes.DELETE,
        replacements: { id },
        transaction,
      });
    }),
};

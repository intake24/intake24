/**
 * Crate new permissions and assign to default role
 *
 * @param {*} records
 * @param {*} { roleNames = ['superuser'], queryInterface, transaction }
 */
export async function createPermissions(records, { roleNames = ['superuser'], queryInterface, transaction }) {
  const { QueryTypes } = queryInterface.sequelize;

  const created_at = new Date();
  const updated_at = created_at;
  const timestamps = { created_at, updated_at };

  await queryInterface.bulkInsert(
    'permissions',
    records.map(permission => ({ ...permission, ...timestamps })),
    { transaction },
  );

  const roles = await queryInterface.sequelize.query(
    `SELECT id, name FROM roles WHERE name IN (:roleNames);`,
    {
      type: QueryTypes.SELECT,
      replacements: { roleNames },
      transaction,
    },
  );

  const permissionNames = records.map(({ name }) => name);
  const permissions = await queryInterface.sequelize.query(
    `SELECT id, name FROM permissions WHERE name IN (:permissionNames);`,
    {
      type: QueryTypes.SELECT,
      replacements: { permissionNames },
      transaction,
    },
  );

  const mappings = [];
  roles.forEach((role) => {
    permissions.reduce((acc, perm) => {
      acc.push({ permission_id: perm.id, role_id: role.id, created_at, updated_at });
      return acc;
    }, mappings);
  });

  // Length check is a workaround for https://github.com/sequelize/sequelize/issues/11071
  if (mappings.length > 0)
    await queryInterface.bulkInsert('permission_role', mappings, { transaction });
}

/**
 * update sequence after table re-creation
 *
 * @param {*} table
 * @param {*} column
 * @param {*} { queryInterface, transaction }
 * @returns
 */
export async function updateSequence(table, column, { queryInterface, transaction }) {
  const [[{ max }]] = await queryInterface.sequelize.query(`SELECT MAX(${column}) FROM ${table}`, {
    transaction,
  });

  if (!max)
    return;

  await queryInterface.sequelize.query(
    `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), max(${column})) FROM ${table};`,
    { transaction },
  );
}

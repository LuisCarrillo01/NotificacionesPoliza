const { executeQuery } = require('../../config/database');

async function findUserByUsernameOrEmail(usernameOrEmail) {
  const queryText = `
    SELECT
      id,
      rol,
      hospital_id,
      aseguradora_id,
      username,
      email,
      password_hash,
      nombre_completo,
      estado
    FROM usuarios
    WHERE username = $1 OR email = $1
    LIMIT 1
  `;

  const queryResult = await executeQuery(queryText, [usernameOrEmail]);
  return queryResult.rows[0] || null;
}

async function findUserById(userId) {
  const queryText = `
    SELECT
      id,
      rol,
      hospital_id,
      aseguradora_id,
      username,
      email,
      nombre_completo,
      estado,
      ultimo_acceso_at,
      created_at,
      updated_at
    FROM usuarios
    WHERE id = $1
    LIMIT 1
  `;

  const queryResult = await executeQuery(queryText, [userId]);
  return queryResult.rows[0] || null;
}

async function updateLastAccessAt(userId) {
  await executeQuery(
    `
      UPDATE usuarios
      SET ultimo_acceso_at = now()
      WHERE id = $1
    `,
    [userId]
  );
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserById,
  updateLastAccessAt
};

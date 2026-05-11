const { executeQuery } = require('../../config/database');

async function createPatient(patientData) {
  const queryText = `
    INSERT INTO pacientes (
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      fecha_nacimiento,
      sexo,
      telefono,
      email,
      direccion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const queryParams = [
    patientData.documentType,
    patientData.documentNumber,
    patientData.firstName,
    patientData.lastName,
    patientData.birthDate,
    patientData.gender,
    patientData.phoneNumber,
    patientData.emailAddress,
    patientData.address
  ];

  const queryResult = await executeQuery(queryText, queryParams);
  return queryResult.rows[0];
}

async function findPatientById(patientId) {
  const queryResult = await executeQuery('SELECT * FROM pacientes WHERE id = $1 LIMIT 1', [patientId]);
  return queryResult.rows[0] || null;
}

async function findPatientByDocument(documentType, documentNumber) {
  const queryResult = await executeQuery(
    'SELECT * FROM pacientes WHERE tipo_documento = $1 AND numero_documento = $2 LIMIT 1',
    [documentType, documentNumber]
  );

  return queryResult.rows[0] || null;
}

async function findRecentPatients(limit = 5) {
  const queryResult = await executeQuery(
    'SELECT * FROM pacientes ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return queryResult.rows;
}

module.exports = {
  createPatient,
  findPatientById,
  findPatientByDocument,
  findRecentPatients
};

const { executeQuery } = require('../../config/database');

async function createNotification(notificationData) {
  const queryText = `
    INSERT INTO notificaciones (
      validacion_id,
      usuario_destinatario_id,
      tipo,
      canal,
      estado,
      titulo,
      mensaje,
      fecha_generacion,
      fecha_envio,
      fecha_lectura
    )
    VALUES ($1, $2, $3, COALESCE($4, 'bandeja_interna'), $5, $6, $7, COALESCE($8, now()), $9, $10)
    RETURNING *
  `;

  const queryParams = [
    notificationData.validationId,
    notificationData.recipientUserId,
    notificationData.notificationType,
    notificationData.channel,
    notificationData.notificationStatus,
    notificationData.title,
    notificationData.message,
    notificationData.generatedAt,
    notificationData.sentAt,
    notificationData.readAt
  ];

  const queryResult = await executeQuery(queryText, queryParams);
  return queryResult.rows[0];
}

async function findNotificationsByRecipientUserId(recipientUserId) {
  const queryResult = await executeQuery(
    'SELECT * FROM notificaciones WHERE usuario_destinatario_id = $1 ORDER BY fecha_generacion DESC',
    [recipientUserId]
  );

  return queryResult.rows;
}

async function findPendingNotificationsByRecipientUserId(recipientUserId) {
  const queryResult = await executeQuery(
    "SELECT * FROM notificaciones WHERE usuario_destinatario_id = $1 AND estado <> 'leida' ORDER BY fecha_generacion DESC",
    [recipientUserId]
  );

  return queryResult.rows;
}

async function findNotificationById(notificationId) {
  const queryResult = await executeQuery('SELECT * FROM notificaciones WHERE id = $1 LIMIT 1', [notificationId]);
  return queryResult.rows[0] || null;
}

async function markNotificationAsRead(notificationId) {
  const queryResult = await executeQuery(
    "UPDATE notificaciones SET estado = 'leida', fecha_lectura = now() WHERE id = $1 RETURNING *",
    [notificationId]
  );

  return queryResult.rows[0] || null;
}

module.exports = {
  createNotification,
  findNotificationsByRecipientUserId,
  findPendingNotificationsByRecipientUserId,
  findNotificationById,
  markNotificationAsRead
};

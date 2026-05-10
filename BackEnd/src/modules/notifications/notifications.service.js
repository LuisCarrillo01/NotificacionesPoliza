const AppError = require('../../shared/errors/AppError');
const notificationsRepository = require('./notifications.repository');

function mapNotificationRecord(notificationRecord) {
  return {
    id: notificationRecord.id,
    validationId: notificationRecord.validacion_id,
    recipientUserId: notificationRecord.usuario_destinatario_id,
    notificationType: notificationRecord.tipo,
    channel: notificationRecord.canal,
    notificationStatus: notificationRecord.estado,
    title: notificationRecord.titulo,
    message: notificationRecord.mensaje,
    generatedAt: notificationRecord.fecha_generacion,
    sentAt: notificationRecord.fecha_envio,
    readAt: notificationRecord.fecha_lectura,
    createdAt: notificationRecord.created_at,
    updatedAt: notificationRecord.updated_at
  };
}

async function listNotifications(authenticatedUser) {
  const notificationRecords = await notificationsRepository.findNotificationsByRecipientUserId(
    authenticatedUser.id
  );

  return notificationRecords.map(mapNotificationRecord);
}

async function listPendingNotifications(authenticatedUser) {
  const notificationRecords = await notificationsRepository.findPendingNotificationsByRecipientUserId(
    authenticatedUser.id
  );

  return notificationRecords.map(mapNotificationRecord);
}

async function getNotificationById(notificationId, authenticatedUser) {
  const notificationRecord = await notificationsRepository.findNotificationById(notificationId);

  if (!notificationRecord) {
    throw new AppError('Notification not found', 404);
  }

  if (notificationRecord.usuario_destinatario_id !== authenticatedUser.id) {
    throw new AppError('You do not have access to this notification', 403);
  }

  return mapNotificationRecord(notificationRecord);
}

async function markNotificationAsRead(notificationId, authenticatedUser) {
  const notificationRecord = await notificationsRepository.findNotificationById(notificationId);

  if (!notificationRecord) {
    throw new AppError('Notification not found', 404);
  }

  if (notificationRecord.usuario_destinatario_id !== authenticatedUser.id) {
    throw new AppError('You do not have access to this notification', 403);
  }

  const updatedNotification = await notificationsRepository.markNotificationAsRead(notificationId);
  return mapNotificationRecord(updatedNotification);
}

module.exports = {
  listNotifications,
  listPendingNotifications,
  getNotificationById,
  markNotificationAsRead
};

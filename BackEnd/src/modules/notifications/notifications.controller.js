const notificationsService = require('./notifications.service');

async function listNotifications(request, response) {
  const notifications = await notificationsService.listNotifications(request.authenticatedUser);
  response.status(200).json(notifications);
}

async function listPendingNotifications(request, response) {
  const notifications = await notificationsService.listPendingNotifications(request.authenticatedUser);
  response.status(200).json(notifications);
}

async function getNotificationById(request, response) {
  const notification = await notificationsService.getNotificationById(
    request.params.notificationId,
    request.authenticatedUser
  );

  response.status(200).json(notification);
}

async function markNotificationAsRead(request, response) {
  const notification = await notificationsService.markNotificationAsRead(
    request.params.notificationId,
    request.authenticatedUser
  );

  response.status(200).json(notification);
}

module.exports = {
  listNotifications,
  listPendingNotifications,
  getNotificationById,
  markNotificationAsRead
};

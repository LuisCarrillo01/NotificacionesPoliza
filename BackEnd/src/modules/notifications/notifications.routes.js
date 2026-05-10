const express = require('express');
const notificationsController = require('./notifications.controller');
const asyncHandler = require('../../shared/utils/asyncHandler');

const notificationsRouter = express.Router();

notificationsRouter.get('/', asyncHandler(notificationsController.listNotifications));
notificationsRouter.get('/pending', asyncHandler(notificationsController.listPendingNotifications));
notificationsRouter.get('/:notificationId', asyncHandler(notificationsController.getNotificationById));
notificationsRouter.patch('/:notificationId/read', asyncHandler(notificationsController.markNotificationAsRead));

module.exports = notificationsRouter;

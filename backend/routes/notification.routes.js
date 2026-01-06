const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const notificationStorage = require('../utils/notification-storage');

module.exports = (blockchain) => {
    // Get notifications for a user
    router.get('/:userEmail', (req, res) => {
        try {
            const { userEmail } = req.params;

            // Verify user is accessing their own notifications or is admin
            if (req.user.email !== userEmail && req.user.role !== 'auditor' && req.user.role !== 'government') {
                return res.status(403).json({ error: 'Cannot access other user notifications' });
            }

            const notifications = notificationStorage.getUserNotifications(userEmail);
            const unreadCount = notificationStorage.getUnreadCount(userEmail);

            res.json({
                notifications,
                unreadCount
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Mark notification as read
    router.put('/:id/read', (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.email;

            const success = notificationStorage.markAsRead(id, userId);

            if (success) {
                res.json({ message: 'Notification marked as read' });
            } else {
                res.status(404).json({ error: 'Notification not found' });
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Mark all notifications as read
    router.put('/read-all', (req, res) => {
        try {
            const userId = req.user.email;
            const count = notificationStorage.markAllAsRead(userId);

            res.json({
                message: `Marked ${count} notifications as read`,
                count
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Delete a notification
    router.delete('/:id', (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.email;

            const success = notificationStorage.deleteNotification(id, userId);

            if (success) {
                res.json({ message: 'Notification deleted' });
            } else {
                res.status(404).json({ error: 'Notification not found' });
            }
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Create notification (internal use by other routes)
    const createNotification = (userId, type, title, message, data = {}) => {
        const notification = {
            id: uuidv4(),
            userId,
            type,
            title,
            message,
            data,
            read: false,
            createdAt: new Date().toISOString()
        };

        return notificationStorage.createNotification(notification);
    };

    // Expose createNotification for other routes to use
    router.createNotification = createNotification;

    return router;
};

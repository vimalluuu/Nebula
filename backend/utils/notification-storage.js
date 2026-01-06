class NotificationStorage {
    constructor() {
        this.notifications = new Map(); // userId -> notifications array
    }

    // Create a new notification
    createNotification(notification) {
        const { userId } = notification;

        if (!this.notifications.has(userId)) {
            this.notifications.set(userId, []);
        }

        const userNotifications = this.notifications.get(userId);
        userNotifications.unshift(notification); // Add to beginning

        // Keep only last 50 notifications per user
        if (userNotifications.length > 50) {
            userNotifications.pop();
        }

        return notification;
    }

    // Get all notifications for a user
    getUserNotifications(userId) {
        return this.notifications.get(userId) || [];
    }

    // Get unread count for a user
    getUnreadCount(userId) {
        const userNotifications = this.getUserNotifications(userId);
        return userNotifications.filter(n => !n.read).length;
    }

    // Mark notification as read
    markAsRead(notificationId, userId) {
        const userNotifications = this.getUserNotifications(userId);
        const notification = userNotifications.find(n => n.id === notificationId);

        if (notification) {
            notification.read = true;
            return true;
        }
        return false;
    }

    // Mark all as read for a user
    markAllAsRead(userId) {
        const userNotifications = this.getUserNotifications(userId);
        userNotifications.forEach(n => n.read = true);
        return userNotifications.length;
    }

    // Delete a notification
    deleteNotification(notificationId, userId) {
        const userNotifications = this.getUserNotifications(userId);
        const index = userNotifications.findIndex(n => n.id === notificationId);

        if (index !== -1) {
            userNotifications.splice(index, 1);
            return true;
        }
        return false;
    }

    // Clear all notifications for a user
    clearUserNotifications(userId) {
        this.notifications.delete(userId);
    }

    // Clear all notifications (for testing)
    clearAll() {
        this.notifications.clear();
    }
}

// Create singleton instance
const notificationStorage = new NotificationStorage();

module.exports = notificationStorage;

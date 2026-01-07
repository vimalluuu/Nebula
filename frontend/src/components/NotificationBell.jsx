import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function NotificationBell({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/notifications/${user.email}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="notification-bell-container">
            {/* Bell Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="notification-btn"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="notification-dropdown card">
                    {/* Header */}
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                className="mark-read-btn"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <p className="icon">🔕</p>
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                >
                                    <div className="notification-content-wrapper">
                                        <div className="notification-text">
                                            <p className="title">{notification.title}</p>
                                            <p className="message">{notification.message}</p>
                                            <p className="time">{formatTime(notification.createdAt)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            className="delete-btn"
                                            title="Delete notification"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    onClick={() => setShowDropdown(false)}
                    className="dropdown-overlay"
                />
            )}
        </div>
    );
}

export default NotificationBell;

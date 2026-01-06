import { useState, useEffect } from 'react';
import { notificationAPI } from '../api';

function VendorNotifications({ vendorEmail }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [vendorEmail]);

    const loadNotifications = async () => {
        try {
            const response = await notificationAPI.getNotifications(vendorEmail);
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading notifications...</div>;
    }

    const awardNotifications = notifications.filter(n => n.type === 'AWARD');

    return (
        <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span>🎉</span> Your Awarded Tenders
            </h3>

            {awardNotifications.length > 0 ? (
                awardNotifications.map((notification) => (
                    <div key={notification.id} className="card" style={{
                        background: 'var(--secondary-light)',
                        borderColor: 'var(--secondary)',
                        marginBottom: '1.5rem'
                    }}>
                        <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
                            ✅ {notification.title}
                        </h3>
                        <p style={{ marginBottom: '0.75rem' }}>{notification.message}</p>
                        <p><strong>Contract Value:</strong> ₹{notification.contractValue.toLocaleString()}</p>
                        <p><strong>Awarded On:</strong> {new Date(notification.awardedAt).toLocaleDateString()}</p>
                        <p style={{
                            fontSize: '0.8125rem',
                            color: 'var(--gray-600)',
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--secondary)'
                        }}>
                            🔗 Blockchain Verified | Block #{notification.blockIndex} | Hash: {notification.blockHash.substring(0, 16)}...
                        </p>
                    </div>
                ))
            ) : (
                <div className="empty-state">
                    <p>No tenders awarded yet. Keep bidding on open tenders!</p>
                </div>
            )}
        </div>
    );
}

export default VendorNotifications;

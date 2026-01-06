import { useState, useEffect } from 'react';
import './index.css';
import LoginModal from './components/LoginModal';
import GovernmentTab from './components/GovernmentTab';
import VendorTab from './components/VendorTab';
import AuditorTab from './components/AuditorTab';
import PublicTab from './components/PublicTab';
import PaymentManagement from './components/PaymentManagement';

function App() {
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [activeTab, setActiveTab] = useState('government');

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);

                // Set default tab based on role
                if (userData.role === 'government') setActiveTab('government');
                else if (userData.role === 'vendor') setActiveTab('vendor');
                else if (userData.role === 'auditor') setActiveTab('auditor');
            } catch (error) {
                // Invalid stored data, clear it
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);

        // Set default tab based on role
        if (userData.role === 'government') setActiveTab('government');
        else if (userData.role === 'vendor') setActiveTab('vendor');
        else if (userData.role === 'auditor') setActiveTab('auditor');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setShowLoginModal(false);
    };

    // Public view (not logged in)
    if (!user) {
        return (
            <div className="app">
                <div className="public-header">
                    <div className="header-content">
                        <div className="logo-section">
                            <h1>🏛️ Procurement Monitoring System</h1>
                            <p>Blockchain-Powered Transparency for Public Procurement</p>
                        </div>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="btn-login"
                        >
                            Login / Signup
                        </button>
                    </div>
                </div>

                <PublicTab />

                {showLoginModal && (
                    <LoginModal
                        onClose={() => setShowLoginModal(false)}
                        onLoginSuccess={handleLoginSuccess}
                    />
                )}
            </div>
        );
    }

    // Logged in view
    return (
        <div className="app">
            <div className="header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>🏛️ Procurement Monitoring System</h1>
                        <p>Corruption-Resistant Public Procurement Platform</p>
                    </div>

                    <div className="user-section">
                        <div className="user-info">
                            <span className="user-badge">{user.role.toUpperCase()}</span>
                            <span className="user-name">{user.name}</span>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="tabs">
                {user.role === 'government' && (
                    <>
                        <button
                            className={`tab ${activeTab === 'government' ? 'active' : ''}`}
                            onClick={() => setActiveTab('government')}
                        >
                            🏛️ Tenders & Contracts
                        </button>
                        <button
                            className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            💰 Payments
                        </button>
                    </>
                )}

                {user.role === 'vendor' && (
                    <button
                        className={`tab ${activeTab === 'vendor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vendor')}
                    >
                        🏢 Vendor
                    </button>
                )}

                {user.role === 'auditor' && (
                    <>
                        <button
                            className={`tab ${activeTab === 'auditor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('auditor')}
                        >
                            🔍 Auditor
                        </button>
                        <button
                            className={`tab ${activeTab === 'blockchain' ? 'active' : ''}`}
                            onClick={() => setActiveTab('blockchain')}
                        >
                            ⛓️ Blockchain
                        </button>
                    </>
                )}
            </div>

            <div className="dashboard-content">
                {activeTab === 'government' && <GovernmentTab user={user} />}
                {activeTab === 'payments' && <PaymentManagement user={user} />}
                {activeTab === 'vendor' && <VendorTab user={user} />}
                {activeTab === 'auditor' && <AuditorTab user={user} />}
                {activeTab === 'blockchain' && <AuditorTab user={user} showBlockchain={true} />}
            </div>
        </div>
    );
}

export default App;

import { useState } from 'react';
import { authAPI } from '../api';
import VendorSignup from './VendorSignup';

function LoginModal({ onClose, onLoginSuccess }) {
    const [activeTab, setActiveTab] = useState('login');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(loginForm.email, loginForm.password);
            const { token, user } = response.data;

            // Store in localStorage for persistence
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            onLoginSuccess(user);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSuccess = (user) => {
        onLoginSuccess(user);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal login-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Vendor Signup
                    </button>
                </div>

                {activeTab === 'login' ? (
                    <div className="login-form-container">
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>🔐</span>
                                Login
                            </h2>
                            <p className="subtitle">Government officials and registered vendors</p>
                        </div>

                        {error && <div className="alert error">{error}</div>}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    placeholder="your@email.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className="demo-credentials">
                            <strong>Demo Credentials:</strong><br />
                            Government: gov@demo.com / demo123<br />
                            Vendor: vendor1@demo.com / demo123<br />
                            Auditor: auditor@demo.com / demo123
                        </div>
                    </div>
                ) : (
                    <VendorSignup
                        onSuccess={handleSignupSuccess}
                        onCancel={onClose}
                    />
                )}
            </div>
        </div>
    );
}

export default LoginModal;

import { useState } from 'react';
import { authAPI } from '../api';

function VendorSignup({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        companyName: '',
        registrationNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        contactPerson: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...vendorData } = formData;
            const response = await authAPI.register(vendorData);

            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            onSuccess(response.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="vendor-signup">
            <h2>🏢 Vendor Registration</h2>
            <p className="subtitle">Register your company to participate in tenders</p>

            {error && <div className="alert error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Company Name *</label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            placeholder="ABC Construction Pvt Ltd"
                        />
                    </div>

                    <div className="form-group">
                        <label>Registration Number *</label>
                        <input
                            type="text"
                            name="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={handleChange}
                            required
                            placeholder="CIN/Registration No"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="company@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Contact Person *</label>
                        <input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            required
                            placeholder="Full Name"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                            placeholder="Min 6 characters"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Re-enter password"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 1234567890"
                    />
                </div>

                <div className="form-group">
                    <label>Address</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Street address"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                        />
                    </div>

                    <div className="form-group">
                        <label>State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="State"
                        />
                    </div>

                    <div className="form-group">
                        <label>Pincode</label>
                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            placeholder="123456"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Registering...' : 'Register Company'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default VendorSignup;

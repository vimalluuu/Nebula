import { useState } from 'react';
import { vendorAPI } from '../api';

function VendorRegistration({ user, onRegistrationComplete }) {
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        registrationNumber: '',
        address: '',
        phone: '',
        category: 'Construction',
        yearsInBusiness: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await vendorAPI.register(formData);
            setMessage({
                type: 'success',
                text: `✅ Registration successful! Your vendor profile has been recorded on the blockchain (Block #${response.data.blockIndex})`
            });

            // Call parent callback if provided
            if (onRegistrationComplete) {
                onRegistrationComplete(response.data.vendor);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Registration failed. Please try again.'
            });
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
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span>📝</span> Vendor Registration
            </h2>

            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                Register your company to participate in government procurement tenders
            </p>

            {message && (
                <div className={`alert ${message.type}`} style={{ marginBottom: '1.5rem' }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Company Name *</label>
                    <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="ABC Construction Ltd"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Registration Number *</label>
                    <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="REG123456"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Business Address *</label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="123 Main Street, City, State, ZIP"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1234567890"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Business Category *</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="Construction">Construction</option>
                        <option value="IT Services">IT Services</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Years in Business *</label>
                    <input
                        type="number"
                        name="yearsInBusiness"
                        value={formData.yearsInBusiness}
                        onChange={handleChange}
                        placeholder="10"
                        min="0"
                        max="100"
                        required
                    />
                </div>

                <div style={{
                    padding: '1rem',
                    background: '#EFF6FF',
                    borderRadius: '0.5rem',
                    border: '1px solid #BFDBFE',
                    marginBottom: '1.5rem'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1E40AF' }}>
                        <strong>🔒 Blockchain Security:</strong> Your registration will be permanently recorded on the blockchain, ensuring transparency and preventing fraud.
                    </p>
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? 'Registering...' : '✅ Register as Vendor'}
                </button>
            </form>
        </div>
    );
}

export default VendorRegistration;

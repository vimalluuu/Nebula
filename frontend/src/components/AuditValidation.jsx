import { useState, useEffect } from 'react';
import { auditAPI } from '../api';

function AuditValidation({ tender, onValidated }) {
    const [auditStatus, setAuditStatus] = useState('CLEARED');
    const [auditorComments, setAuditorComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await auditAPI.validate(tender.id, {
                auditStatus,
                aiRiskScore: 'PENDING', // In real app, would come from AI service
                aiExplanation: 'AI analysis pending',
                auditorComments
            });

            alert('Audit validation recorded on blockchain!');
            if (onValidated) onValidated();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to validate tender');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span>🔍</span> Validate Tender: {tender.title}
            </h3>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '0.5rem' }}>
                <p><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                <p><strong>Deadline:</strong> {tender.deadline}</p>
                <p><strong>Bid Count:</strong> {tender.bidCount || 0}</p>
            </div>

            {error && <div className="alert error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Audit Status *</label>
                    <select
                        value={auditStatus}
                        onChange={(e) => setAuditStatus(e.target.value)}
                        required
                    >
                        <option value="CLEARED">✅ CLEARED - Process is clean</option>
                        <option value="FLAGGED">⚠️ FLAGGED - Concerns identified</option>
                        <option value="HIGH_RISK">❌ HIGH_RISK - Serious issues detected</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Auditor Comments *</label>
                    <textarea
                        value={auditorComments}
                        onChange={(e) => setAuditorComments(e.target.value)}
                        rows="4"
                        placeholder="Provide your audit findings and recommendations..."
                        required
                        minLength="20"
                    />
                </div>

                <div style={{
                    padding: '1rem',
                    background: auditStatus === 'CLEARED' ? 'var(--secondary-light)' :
                        auditStatus === 'FLAGGED' ? '#FEF3C7' : '#FEE2E2',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <strong>Impact:</strong>
                    {auditStatus === 'CLEARED' && ' Government can award directly'}
                    {auditStatus === 'FLAGGED' && ' Government must provide justification to award'}
                    {auditStatus === 'HIGH_RISK' && ' Award will be BLOCKED by system'}
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Recording on Blockchain...' : 'Record Audit Validation'}
                </button>
            </form>
        </div>
    );
}

export default AuditValidation;

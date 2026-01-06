import { useState, useEffect } from 'react';
import { contractAPI, auditAPI } from '../api';

function GovernmentAwardControl({ tender, bids, onAwarded }) {
    const [selectedBid, setSelectedBid] = useState('');
    const [reason, setReason] = useState('');
    const [justification, setJustification] = useState('');
    const [auditStatus, setAuditStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuditStatus();
    }, [tender.id]);

    const checkAuditStatus = async () => {
        try {
            const response = await auditAPI.getStatus(tender.id);
            setAuditStatus(response.data);
        } catch (err) {
            console.error('Error checking audit status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAward = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const awardData = {
                tenderId: tender.id,
                bidId: selectedBid,
                reason,
                justification: auditStatus?.audit?.auditStatus === 'FLAGGED' ? justification : undefined
            };

            await contractAPI.award(awardData);
            alert('Contract awarded successfully and recorded on blockchain!');
            if (onAwarded) onAwarded();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to award contract');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Checking audit status...</div>;
    }

    // Check if tender is closed
    const isClosed = new Date(tender.deadline) < new Date();
    if (!isClosed) {
        return (
            <div className="alert warning">
                Tender is still open. Wait until deadline ({tender.deadline}) to award.
            </div>
        );
    }

    // Check audit validation
    if (!auditStatus?.validated) {
        return (
            <div className="alert error">
                ⚠️ <strong>Audit Validation Required</strong><br />
                This tender must be validated by an auditor before you can award the contract.
            </div>
        );
    }

    const audit = auditStatus.audit;

    // HIGH_RISK - Award blocked
    if (audit.auditStatus === 'HIGH_RISK') {
        return (
            <div className="alert error">
                ❌ <strong>Award Blocked - High Risk Detected</strong><br />
                <strong>Auditor:</strong> {audit.auditorName}<br />
                <strong>Comments:</strong> {audit.auditorComments}<br />
                <strong>AI Analysis:</strong> {audit.aiExplanation}<br />
                <br />
                This tender cannot be awarded due to serious issues flagged by the auditor.
            </div>
        );
    }

    return (
        <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span>🏆</span> Award Contract
            </h3>

            {/* Audit Status Display */}
            <div className={`alert ${audit.auditStatus === 'CLEARED' ? 'success' : 'warning'}`} style={{ marginBottom: '1.5rem' }}>
                <strong>Audit Status:</strong> {audit.auditStatus}<br />
                <strong>Auditor:</strong> {audit.auditorName}<br />
                <strong>Comments:</strong> {audit.auditorComments}
                {audit.auditStatus === 'FLAGGED' && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '0.375rem' }}>
                        ⚠️ <strong>Justification Required:</strong> You must provide written justification (minimum 50 characters) to award this flagged tender.
                    </div>
                )}
            </div>

            {error && <div className="alert error">{error}</div>}

            <form onSubmit={handleAward}>
                <div className="form-group">
                    <label>Select Winning Bid *</label>
                    <select
                        value={selectedBid}
                        onChange={(e) => setSelectedBid(e.target.value)}
                        required
                    >
                        <option value="">-- Select a bid --</option>
                        {bids.map(bid => (
                            <option key={bid.id} value={bid.id}>
                                {bid.vendorName} - ₹{bid.amount.toLocaleString()} ({bid.timeline})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Reason for Award</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows="3"
                        placeholder="Why is this the best bid?"
                    />
                </div>

                {audit.auditStatus === 'FLAGGED' && (
                    <div className="form-group">
                        <label>Justification (Required for Flagged Tender) *</label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows="4"
                            placeholder="Provide detailed justification for awarding this flagged tender (minimum 50 characters)..."
                            required
                            minLength="50"
                            style={{ borderColor: 'var(--warning)' }}
                        />
                        <small style={{ color: 'var(--gray-600)' }}>
                            {justification.length}/50 characters minimum
                        </small>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-success"
                    disabled={submitting || !selectedBid}
                >
                    {submitting ? 'Recording on Blockchain...' : '🏆 Award Contract'}
                </button>
            </form>
        </div>
    );
}

export default GovernmentAwardControl;

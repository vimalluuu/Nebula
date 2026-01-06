import { useState, useEffect } from 'react';
import { paymentAPI, contractAPI } from '../api';

function PaymentManagement({ user }) {
    const [contracts, setContracts] = useState([]);
    const [selectedContract, setSelectedContract] = useState(null);
    const [payments, setPayments] = useState([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        milestone: '',
        description: '',
        paymentType: 'MILESTONE'
    });

    useEffect(() => {
        loadContracts();
    }, []);

    const loadContracts = async () => {
        try {
            const response = await contractAPI.getAll();
            setContracts(response.data.contracts);
        } catch (error) {
            console.error('Error loading contracts:', error);
        }
    };

    const loadPayments = async (contractId) => {
        try {
            const response = await paymentAPI.getByContract(contractId);
            setPayments(response.data.payments);
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    };

    const handleSelectContract = (contract) => {
        setSelectedContract(contract);
        loadPayments(contract.id);
        setShowPaymentForm(false);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await paymentAPI.create({
                contractId: selectedContract.id,
                ...paymentForm,
                amount: parseFloat(paymentForm.amount)
            });

            setMessage({
                type: 'success',
                text: `✅ Payment recorded successfully! (Block #${response.data.blockIndex})`
            });
            setPaymentForm({ amount: '', milestone: '', description: '', paymentType: 'MILESTONE' });
            setShowPaymentForm(false);
            loadPayments(selectedContract.id);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to record payment'
            });
        } finally {
            setLoading(false);
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = selectedContract ? selectedContract.winningBid.amount - totalPaid : 0;

    return (
        <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💰</span> Payment Management
            </h2>

            {message && (
                <div className={`alert ${message.type}`} style={{ marginBottom: '1.5rem' }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Contracts List */}
                <div>
                    <h3>Awarded Contracts</h3>
                    {contracts.length === 0 ? (
                        <div className="empty-state">
                            <p>No contracts awarded yet</p>
                        </div>
                    ) : (
                        contracts.map(contract => (
                            <div
                                key={contract.id}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    border: selectedContract?.id === contract.id ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                                    background: selectedContract?.id === contract.id ? 'var(--primary-light)' : 'white',
                                    marginBottom: '1rem'
                                }}
                                onClick={() => handleSelectContract(contract)}
                            >
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{contract.tenderTitle}</h4>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
                                    <strong>Vendor:</strong> {contract.winningBid.vendorName}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>
                                    ₹{contract.winningBid.amount.toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment Details */}
                <div>
                    {selectedContract ? (
                        <>
                            <div className="card" style={{ marginBottom: '1.5rem', background: '#F9FAFB' }}>
                                <h3>{selectedContract.tenderTitle}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Contract Value</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' }}>
                                            ₹{selectedContract.winningBid.amount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Total Paid</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#059669' }}>
                                            ₹{totalPaid.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Remaining</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#DC2626' }}>
                                            ₹{remaining.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPaymentForm(!showPaymentForm)}
                                className="btn-primary"
                                style={{ marginBottom: '1.5rem' }}
                            >
                                {showPaymentForm ? 'Cancel' : '+ Record Payment'}
                            </button>

                            {showPaymentForm && (
                                <div className="card" style={{ marginBottom: '1.5rem' }}>
                                    <h4>Record New Payment</h4>
                                    <form onSubmit={handleSubmitPayment}>
                                        <div className="form-group">
                                            <label>Amount (₹) *</label>
                                            <input
                                                type="number"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                placeholder="5000000"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Milestone *</label>
                                            <input
                                                type="text"
                                                value={paymentForm.milestone}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, milestone: e.target.value })}
                                                placeholder="Phase 1 Completion"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <textarea
                                                value={paymentForm.description}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                                rows="2"
                                                placeholder="Payment details"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Payment Type *</label>
                                            <select
                                                value={paymentForm.paymentType}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                                            >
                                                <option value="ADVANCE">Advance Payment</option>
                                                <option value="MILESTONE">Milestone Payment</option>
                                                <option value="FINAL">Final Payment</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn-success" disabled={loading}>
                                            {loading ? 'Recording...' : '✅ Record Payment'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <h4>Payment History</h4>
                            {payments.length === 0 ? (
                                <div className="empty-state">
                                    <p>No payments recorded yet</p>
                                </div>
                            ) : (
                                payments.map(payment => (
                                    <div key={payment.id} className="card" style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{payment.milestone}</h4>
                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>
                                                    {payment.description || 'No description'}
                                                </p>
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                                    {new Date(payment.disbursedAt).toLocaleDateString()} • Block #{payment.blockIndex}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#059669' }}>
                                                    ₹{payment.amount.toLocaleString()}
                                                </p>
                                                <span className="badge" style={{ background: '#10B981', marginTop: '0.5rem' }}>
                                                    {payment.paymentType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Select a contract to view payment details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentManagement;

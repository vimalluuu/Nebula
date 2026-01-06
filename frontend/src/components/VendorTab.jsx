import { useState, useEffect } from 'react';
import { tenderAPI, bidAPI, contractAPI } from '../api';

function VendorTab({ user }) {
    const [tenders, setTenders] = useState([]);
    const [selectedTender, setSelectedTender] = useState(null);
    const [showBidForm, setShowBidForm] = useState(false);
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [expandedTender, setExpandedTender] = useState(null); // For showing bid details
    const [myContracts, setMyContracts] = useState([]); // Awarded contracts

    const [bidForm, setBidForm] = useState({
        amount: '',
        proposal: '',
        timeline: ''
    });

    useEffect(() => {
        loadTenders();
    }, []);

    const loadTenders = async () => {
        try {
            const response = await tenderAPI.getAll();
            setTenders(response.data.tenders.filter(t => t.status === 'OPEN'));

            // Load my bids
            const allBids = [];
            for (const tender of response.data.tenders) {
                try {
                    const bidsResponse = await bidAPI.getByTender(tender.id);
                    const userBids = bidsResponse.data.bids.filter(b => b.vendorEmail === user.email);
                    allBids.push(...userBids.map(b => ({ ...b, tenderTitle: tender.title })));
                } catch (error) {
                    console.error('Error loading bids for tender:', error);
                }
            }
            setMyBids(allBids);

            // Load awarded contracts for this vendor
            try {
                const contractsResponse = await contractAPI.getAll();
                const vendorContracts = contractsResponse.data.contracts.filter(
                    c => c.winningBid.vendorEmail === user.email
                );
                setMyContracts(vendorContracts);
            } catch (error) {
                console.error('Error loading contracts:', error);
            }
        } catch (error) {
            console.error('Error loading tenders:', error);
        }
    };

    const handleSubmitBid = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await bidAPI.create({
                tenderId: selectedTender.id,
                amount: parseFloat(bidForm.amount),
                proposal: bidForm.proposal,
                timeline: bidForm.timeline
            });

            let messageText = 'Bid submitted successfully and recorded on blockchain!';

            // Check for AI analysis
            if (response.data.aiAnalysis) {
                const { riskScore, explanation } = response.data.aiAnalysis;
                if (riskScore > 50) {
                    messageText += ` ⚠️ AI Risk Score: ${riskScore}/100 - ${explanation}`;
                }
            }

            setMessage({ type: 'success', text: messageText });
            setBidForm({ amount: '', proposal: '', timeline: '' });
            setShowBidForm(false);
            setSelectedTender(null);
            loadTenders();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to submit bid' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>🏢 Vendor Dashboard</h2>

            {message && (
                <div className={`alert ${message.type}`}>{message.text}</div>
            )}

            <div className="grid">
                <div className="stat-card">
                    <h4>Available Tenders</h4>
                    <div className="value">{tenders.length}</div>
                </div>
                <div className="stat-card">
                    <h4>My Bids</h4>
                    <div className="value">{myBids.length}</div>
                </div>
            </div>

            {/* Awarded Contracts Section - Show prominently if vendor has won */}
            {myContracts.length > 0 && (
                <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        color: '#065F46'
                    }}>
                        🏆 Congratulations! You Won {myContracts.length} Contract{myContracts.length > 1 ? 's' : ''}
                    </h3>

                    {myContracts.map((contract) => (
                        <div key={contract.id} className="card" style={{
                            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                            border: '3px solid #10B981',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <span style={{ fontSize: '2rem' }}>🎉</span>
                                <h3 style={{ margin: 0, color: '#065F46' }}>
                                    {contract.tenderTitle}
                                    <span className="badge" style={{
                                        background: '#10B981',
                                        color: 'white',
                                        marginLeft: '0.75rem'
                                    }}>
                                        CONTRACT AWARDED
                                    </span>
                                </h3>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '0.5rem',
                                marginBottom: '1rem'
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Contract Value</p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: '700', color: '#065F46' }}>
                                        ₹{contract.winningBid.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Timeline</p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.125rem', fontWeight: '600', color: '#047857' }}>
                                        {contract.winningBid.timeline}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280' }}>Awarded On</p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.125rem', fontWeight: '600', color: '#047857' }}>
                                        {new Date(contract.awardedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '0.5rem',
                                border: '1px solid #10B981'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#065F46' }}>
                                    <strong>📋 Your Proposal:</strong> {contract.winningBid.proposal}
                                </p>
                            </div>

                            <p style={{
                                marginTop: '1rem',
                                marginBottom: 0,
                                fontSize: '0.8125rem',
                                color: '#047857'
                            }}>
                                🔗 Blockchain Verified | Block #{contract.blockIndex} | Hash: {contract.blockHash.substring(0, 16)}...
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {showBidForm && selectedTender && (
                <div className="card">
                    <h3>Submit Bid for: {selectedTender.title}</h3>
                    <p><strong>Budget:</strong> ₹{selectedTender.budget.toLocaleString()}</p>

                    <form onSubmit={handleSubmitBid}>
                        <div className="form-group">
                            <label>Bid Amount (₹) *</label>
                            <input
                                type="number"
                                value={bidForm.amount}
                                onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                                placeholder="Enter your bid amount"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Proposal *</label>
                            <textarea
                                value={bidForm.proposal}
                                onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                                rows="3"
                                placeholder="Describe your proposal"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Timeline *</label>
                            <input
                                type="text"
                                value={bidForm.timeline}
                                onChange={(e) => setBidForm({ ...bidForm, timeline: e.target.value })}
                                placeholder="e.g., 6 months"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Bid'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowBidForm(false); setSelectedTender(null); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Open Tenders</h3>
            {tenders.map((tender) => {
                const myBid = myBids.find(b => b.tenderId === tender.id);
                const alreadyBid = !!myBid;

                return (
                    <div key={tender.id} className="card" style={{
                        borderColor: alreadyBid ? 'var(--primary)' : 'var(--gray-300)',
                        background: alreadyBid ? 'var(--primary-light)' : 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                                <h3>
                                    {tender.title}
                                    {alreadyBid && <span className="badge" style={{ background: 'var(--primary)', marginLeft: '0.5rem' }}>✓ BID SUBMITTED</span>}
                                </h3>
                                <p>{tender.description}</p>
                                <p><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                                <p><strong>Deadline:</strong> {tender.deadline}</p>
                                {tender.requirements && <p><strong>Requirements:</strong> {tender.requirements}</p>}

                                {/* Show bid details if already submitted */}
                                {alreadyBid && myBid && (
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: 'white',
                                        borderRadius: '0.5rem',
                                        border: '2px solid var(--primary)'
                                    }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
                                            📋 Your Submitted Bid
                                        </h4>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            <p><strong>Bid Amount:</strong> ₹{myBid.amount.toLocaleString()}</p>
                                            <p><strong>Timeline:</strong> {myBid.timeline}</p>
                                            <p><strong>Proposal:</strong> {myBid.proposal}</p>
                                            <p><strong>Submitted:</strong> {new Date(myBid.submittedAt).toLocaleString()}</p>
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                                                🔗 Blockchain Block #{myBid.blockIndex}
                                            </p>
                                        </div>
                                        <div className="alert warning" style={{ marginTop: '1rem', marginBottom: 0 }}>
                                            ⚠️ <strong>Bid Already Submitted</strong><br />
                                            Your bid has been recorded on the blockchain and cannot be edited or deleted.
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!alreadyBid && (
                                <button
                                    onClick={() => { setSelectedTender(tender); setShowBidForm(true); }}
                                    className="btn-success"
                                >
                                    Submit Bid
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {tenders.length === 0 && (
                <div className="empty-state">
                    <p>No open tenders available at the moment</p>
                </div>
            )}

            <h3 style={{ marginTop: '40px', marginBottom: '15px' }}>My Submitted Bids</h3>
            {myBids.map((bid) => (
                <div key={bid.id} className="card">
                    <h4>{bid.tenderTitle}</h4>
                    <p><strong>Amount:</strong> ₹{bid.amount.toLocaleString()}</p>
                    <p><strong>Timeline:</strong> {bid.timeline}</p>
                    <p><strong>Status:</strong> <span className="badge" style={{ background: '#f59e0b' }}>{bid.status}</span></p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                        Submitted: {new Date(bid.submittedAt).toLocaleString()} | Block #{bid.blockIndex}
                    </p>
                </div>
            ))}

            {myBids.length === 0 && !showBidForm && (
                <div className="empty-state">
                    <p>You haven't submitted any bids yet</p>
                </div>
            )}
        </div>
    );
}

export default VendorTab;

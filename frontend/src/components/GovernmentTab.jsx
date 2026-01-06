import { useState, useEffect } from 'react';
import { tenderAPI, bidAPI, contractAPI, auditAPI } from '../api';
import BidChart from './BidChart';
import FileUpload from './FileUpload';

function GovernmentTab({ user }) {
    const [tenders, setTenders] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTender, setSelectedTender] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [auditStatus, setAuditStatus] = useState(null);
    const [contracts, setContracts] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        requirements: '',
        fileUrl: '',
        fileName: '',
        fileType: ''
    });

    useEffect(() => {
        loadTenders();
    }, []);

    const loadTenders = async () => {
        try {
            const response = await tenderAPI.getAll();
            setTenders(response.data.tenders);
        } catch (error) {
            console.error('Error loading tenders:', error);
        }
    };

    const handleCreateTender = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await tenderAPI.create({
                ...formData,
                budget: parseFloat(formData.budget)
            });

            setMessage({ type: 'success', text: 'Tender created successfully and added to blockchain!' });
            setFormData({
                title: '',
                description: '',
                budget: '',
                deadline: '',
                requirements: '',
                fileUrl: '',
                fileName: '',
                fileType: ''
            });
            setShowCreateForm(false);
            loadTenders();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create tender' });
        } finally {
            setLoading(false);
        }
    };

    const viewBids = async (tender) => {
        setSelectedTender(tender);
        try {
            const [bidsResponse, auditResponse, contractsResponse] = await Promise.all([
                bidAPI.getByTender(tender.id),
                auditAPI.getStatus(tender.id),
                contractAPI.getAll()
            ]);

            setBids(bidsResponse.data.bids);
            setAuditStatus(auditResponse.data);

            // Filter contracts for this tender
            const tenderContracts = contractsResponse.data.contracts.filter(
                c => c.tenderId === tender.id
            );
            setContracts(tenderContracts);
        } catch (error) {
            console.error('Error loading bids:', error);
        }
    };

    const awardContract = async (bid) => {
        if (!confirm(`Award contract to ${bid.vendorName} for ₹${bid.amount.toLocaleString()}?`)) {
            return;
        }

        setLoading(true);
        try {
            await contractAPI.award({
                tenderId: selectedTender.id,
                bidId: bid.id,
                reason: 'Best technical and financial proposal'
            });

            setMessage({ type: 'success', text: 'Contract awarded successfully and recorded on blockchain!' });
            setSelectedTender(null);
            setBids([]);
            loadTenders();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to award contract' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🏛️ Government Dashboard</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-secondary">
                    {showCreateForm ? 'Cancel' : '+ Create Tender'}
                </button>
            </div>

            {message && (
                <div className={`alert ${message.type}`}>{message.text}</div>
            )}

            {showCreateForm && (
                <div className="card">
                    <h3>Create New Tender</h3>
                    <form onSubmit={handleCreateTender}>
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Budget (₹) *</label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Deadline *</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Requirements</label>
                            <textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows="2"
                            />
                        </div>

                        <FileUpload
                            label="Tender Document / Specification"
                            uploadType="tender"
                            onFileUploaded={(fileData) => {
                                if (fileData) {
                                    setFormData({
                                        ...formData,
                                        fileUrl: fileData.fileUrl,
                                        fileName: fileData.fileName,
                                        fileType: fileData.fileType
                                    });
                                } else {
                                    setFormData({
                                        ...formData,
                                        fileUrl: '',
                                        fileName: '',
                                        fileType: ''
                                    });
                                }
                            }}
                        />

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Tender'}
                        </button>
                    </form>
                </div>
            )}

            {selectedTender ? (
                <div>
                    <button onClick={() => { setSelectedTender(null); setBids([]); }} className="btn-secondary" style={{ marginBottom: '20px' }}>
                        ← Back to Tenders
                    </button>

                    <div className="card">
                        <h3>{selectedTender.title}</h3>
                        <p><strong>Budget:</strong> ₹{selectedTender.budget.toLocaleString()}</p>
                        <p><strong>Deadline:</strong> {selectedTender.deadline}</p>
                        <p><strong>Bids Received:</strong> {bids.length}</p>

                        {/* Audit Status Display */}
                        {auditStatus && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: auditStatus.submitted ? '#D1FAE5' : '#FEF3C7',
                                borderRadius: '0.5rem',
                                border: `2px solid ${auditStatus.submitted ? '#10B981' : '#F59E0B'}`
                            }}>
                                <p style={{ margin: 0, fontWeight: '600', color: auditStatus.submitted ? '#065F46' : '#92400E' }}>
                                    {auditStatus.submitted ? '✅ Audit Review Completed' : '⏳ Awaiting Auditor Review'}
                                </p>
                                {auditStatus.submitted && (
                                    <>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
                                            Reviewed by {auditStatus.submittedBy} on {new Date(auditStatus.submittedAt).toLocaleString()}
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
                                            Approved Bids: {auditStatus.approvedBids} | Flagged Bids: {auditStatus.flaggedBids}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {bids.length > 0 && (
                        <>
                            <BidChart bids={bids} />

                            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Submitted Bids</h3>
                            {bids.map((bid) => (
                                <div key={bid.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h4>{bid.vendorName}</h4>
                                            <p><strong>Amount:</strong> ₹{bid.amount.toLocaleString()}</p>
                                            <p><strong>Timeline:</strong> {bid.timeline}</p>
                                            <p><strong>Proposal:</strong> {bid.proposal}</p>
                                            <p style={{ fontSize: '12px', color: '#666' }}>
                                                Block #{bid.blockIndex} | Hash: {bid.blockHash.substring(0, 16)}...
                                            </p>
                                        </div>

                                        {/* Check if this bid has been awarded */}
                                        {(() => {
                                            const awardedContract = contracts.find(c => c.bidId === bid.id);

                                            if (awardedContract) {
                                                // Show awarded status
                                                return (
                                                    <div style={{
                                                        padding: '1rem',
                                                        background: '#D1FAE5',
                                                        borderRadius: '0.5rem',
                                                        border: '2px solid #10B981',
                                                        maxWidth: '250px'
                                                    }}>
                                                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#065F46' }}>
                                                            🏆 CONTRACT AWARDED
                                                        </p>
                                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#047857' }}>
                                                            Awarded on {new Date(awardedContract.awardedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                );
                                            }


                                            // Show Award button for APPROVED bids only
                                            const bidFlagStatus = auditStatus?.bidFlags?.[bid.id];
                                            if (auditStatus?.submitted && bidFlagStatus === 'APPROVED') {
                                                return (
                                                    <button onClick={() => awardContract(bid)} className="btn-success">
                                                        Award Contract
                                                    </button>
                                                );
                                            }


                                            // Display status badge based on bid flag

                                            return (
                                                <div style={{
                                                    padding: '0.75rem 1rem',
                                                    background: bidFlagStatus === 'FLAGGED' ? '#FEF3C7' :
                                                        bidFlagStatus === 'APPROVED' ? '#D1FAE5' : '#F3F4F6',
                                                    borderRadius: '0.5rem',
                                                    border: `2px solid ${bidFlagStatus === 'FLAGGED' ? '#F59E0B' :
                                                        bidFlagStatus === 'APPROVED' ? '#10B981' : '#D1D5DB'}`,
                                                    textAlign: 'center',
                                                    maxWidth: '200px'
                                                }}>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600',
                                                        color: bidFlagStatus === 'FLAGGED' ? '#92400E' :
                                                            bidFlagStatus === 'APPROVED' ? '#065F46' : '#4B5563'
                                                    }}>
                                                        {!auditStatus?.submitted
                                                            ? '⏳ Awaiting Audit Review'
                                                            : bidFlagStatus === 'FLAGGED'
                                                                ? '⚠️ Flagged by Auditor'
                                                                : bidFlagStatus === 'APPROVED'
                                                                    ? '✅ Approved by Auditor'
                                                                    : '⏳ Not Reviewed'}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {bids.length === 0 && (
                        <div className="empty-state">
                            <p>No bids received yet</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <h3 style={{ marginBottom: '15px' }}>Active Tenders</h3>
                    {tenders.map((tender) => (
                        <div key={tender.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h3>
                                        {tender.title}
                                        <span className={`badge ${tender.status.toLowerCase()}`}>{tender.status}</span>
                                    </h3>
                                    <p>{tender.description}</p>
                                    {tender.fileUrl && (
                                        <p style={{ marginTop: '0.5rem' }}>
                                            <a
                                                href={tender.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    color: '#2563EB',
                                                    textDecoration: 'none',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                📄 View Tender Document ({tender.fileName})
                                            </a>
                                        </p>
                                    )}
                                    <p><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                                    <p><strong>Deadline:</strong> {tender.deadline}</p>
                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                        Block #{tender.blockIndex} | Hash: {tender.blockHash.substring(0, 16)}...
                                    </p>
                                </div>
                                <button onClick={() => viewBids(tender)} className="btn-secondary">
                                    View Bids
                                </button>
                            </div>
                        </div>
                    ))}

                    {tenders.length === 0 && (
                        <div className="empty-state">
                            <p>No tenders created yet. Click "Create Tender" to get started.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default GovernmentTab;

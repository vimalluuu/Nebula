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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Government Dashboard</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-secondary">
                    {showCreateForm ? 'Cancel' : '+ Create Tender'}
                </button>
            </div>

            {message && (
                <div className={`alert ${message.type}`}>{message.text}</div>
            )}

            {showCreateForm && (
                <div className="card glass-card">
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

                        <div className="form-row">
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

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Tender'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedTender ? (
                <div>
                    <button onClick={() => { setSelectedTender(null); setBids([]); }} className="btn-secondary" style={{ marginBottom: '20px' }}>
                        ← Back to Tenders
                    </button>

                    <div className="card glass-card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedTender.title}</h3>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <span className="badge medium">Budget: ₹{selectedTender.budget.toLocaleString()}</span>
                                    <span className="badge closed">Deadline: {selectedTender.deadline}</span>
                                    <span className="badge open">Bids: {bids.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Audit Status Display */}
                        {auditStatus && (
                            <div className={`alert ${auditStatus.submitted ? 'success' : 'warning'}`} style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '700' }}>
                                        {auditStatus.submitted ? 'Audit Review Completed' : 'Awaiting Auditor Review'}
                                    </p>
                                    {auditStatus.submitted && (
                                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.9 }}>
                                            <p style={{ marginBottom: '0.1rem' }}>Reviewed by {auditStatus.submittedBy} on {new Date(auditStatus.submittedAt).toLocaleString()}</p>
                                            <p style={{ marginBottom: 0 }}>Approved Bids: {auditStatus.approvedBids} | Flagged Bids: {auditStatus.flaggedBids}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {bids.length > 0 && (
                        <>
                            <BidChart bids={bids} />

                            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Submitted Bids</h3>
                            <div className="grid">
                                {bids.map((bid) => (
                                    <div key={bid.id} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexDirection: 'column', height: '100%' }}>
                                            <div style={{ width: '100%' }}>
                                                <h4>{bid.vendorName}</h4>
                                                <div style={{ margin: '1rem 0' }}>
                                                    <p><strong>Amount:</strong> <span style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>₹{bid.amount.toLocaleString()}</span></p>
                                                    <p><strong>Timeline:</strong> {bid.timeline}</p>
                                                    <p><strong>Proposal:</strong> {bid.proposal}</p>
                                                </div>
                                                <div className="block-hash" style={{ fontSize: '0.7rem' }}>
                                                    Block #{bid.blockIndex} | Hash: {bid.blockHash.substring(0, 16)}...
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '1.5rem', width: '100%' }}>
                                                {(() => {
                                                    const awardedContract = contracts.find(c => c.bidId === bid.id);

                                                    if (awardedContract) {
                                                        return (
                                                            <div className="alert success" style={{ padding: '0.75rem', marginBottom: 0 }}>
                                                                <div>
                                                                    <p style={{ fontWeight: '700', margin: 0 }}>🏆 CONTRACT AWARDED</p>
                                                                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>Awarded on {new Date(awardedContract.awardedAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    const bidFlagStatus = auditStatus?.bidFlags?.[bid.id];

                                                    if (auditStatus?.submitted && bidFlagStatus === 'APPROVED') {
                                                        return (
                                                            <button onClick={() => awardContract(bid)} className="btn-success" style={{ width: '100%' }}>
                                                                Check & Award Contract
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <div className={`badge ${!auditStatus?.submitted ? 'closed' : bidFlagStatus === 'FLAGGED' ? 'high' : bidFlagStatus === 'APPROVED' ? 'open' : 'closed'}`} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                                                            {!auditStatus?.submitted
                                                                ? '⏳ Awaiting Audit Review'
                                                                : bidFlagStatus === 'FLAGGED'
                                                                    ? '⚠️ Flagged by Auditor'
                                                                    : bidFlagStatus === 'APPROVED'
                                                                        ? '✅ Approved by Auditor'
                                                                        : '⏳ Not Reviewed'}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                    <div className="grid">
                        {tenders.map((tender) => (
                            <div key={tender.id} className="card">
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0 }}>{tender.title}</h3>
                                            <span className={`badge ${tender.status.toLowerCase()}`}>{tender.status}</span>
                                        </div>

                                        <p style={{ minHeight: '3rem' }}>{tender.description}</p>

                                        <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
                                            <p style={{ marginBottom: '0.5rem' }}><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                                            <p style={{ marginBottom: 0 }}><strong>Deadline:</strong> {tender.deadline}</p>
                                        </div>

                                        {tender.fileUrl && (
                                            <a
                                                href={tender.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-secondary"
                                                style={{ display: 'inline-block', padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem' }}
                                            >
                                                📄 View Tender Doc
                                            </a>
                                        )}

                                        <div className="block-hash" style={{ fontSize: '0.7rem' }}>
                                            Block #{tender.blockIndex}
                                        </div>
                                    </div>

                                    <button onClick={() => viewBids(tender)} className="btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>
                                        View Bids & Manage
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

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

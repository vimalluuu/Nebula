import { useState, useEffect } from 'react';
import { tenderAPI, bidAPI, contractAPI, blockchainAPI, auditAPI } from '../api';
import axios from 'axios';

function AuditorTab({ user, showBlockchain = false }) {
    const [tenders, setTenders] = useState([]);
    const [bids, setBids] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [blockchain, setBlockchain] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedTender, setExpandedTender] = useState(null); // For click-to-expand
    const [bidFlags, setBidFlags] = useState({}); // Store manual flags for bids
    const [auditSubmissions, setAuditSubmissions] = useState({}); // Track submitted audits
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const [tendersRes, contractsRes, blockchainRes] = await Promise.all([
                tenderAPI.getAll(),
                contractAPI.getAll(),
                blockchainAPI.getChain()
            ]);

            setTenders(tendersRes.data.tenders);
            setContracts(contractsRes.data.contracts);
            setBlockchain(blockchainRes.data);

            // Load all bids and get AI analysis
            const allBids = [];
            const aiResults = {};
            const allBidFlags = {};
            const allAuditSubmissions = {};

            for (const tender of tendersRes.data.tenders) {
                try {
                    const bidsRes = await bidAPI.getByTender(tender.id);
                    allBids.push(...bidsRes.data.bids);

                    // Get AI analysis for this tender
                    if (bidsRes.data.bids.length >= 2) {
                        try {
                            const aiRes = await axios.post('http://localhost:5001/detect', {
                                tenderId: tender.id,
                                bids: bidsRes.data.bids
                            });
                            aiResults[tender.id] = aiRes.data;
                        } catch (aiError) {
                            console.warn('AI service unavailable for tender:', tender.id);
                        }
                    }

                    // Load persisted audit data for this tender
                    try {
                        const reviewRes = await auditAPI.getReview(tender.id);
                        const statusRes = await auditAPI.getStatus(tender.id);

                        // Merge bid flags into global state
                        Object.assign(allBidFlags, reviewRes.data.bidFlags);

                        // Store submission status
                        allAuditSubmissions[tender.id] = {
                            submitted: statusRes.data.submitted,
                            submittedAt: statusRes.data.submittedAt,
                            submittedBy: statusRes.data.submittedBy
                        };
                    } catch (auditError) {
                        console.warn('No audit data for tender:', tender.id);
                    }
                } catch (error) {
                    console.error('Error loading bids:', error);
                }
            }

            setBids(allBids);
            setAiAnalysis(aiResults);
            setBidFlags(allBidFlags);
            setAuditSubmissions(allAuditSubmissions);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBidFlag = async (tenderId, bidId, flagType) => {
        console.log('toggleBidFlag called:', { tenderId, bidId, flagType });

        // Check if audit already submitted
        if (auditSubmissions[tenderId]?.submitted) {
            alert('Cannot modify flags after audit has been submitted');
            return;
        }

        const newFlag = bidFlags[bidId] === flagType ? null : flagType;
        console.log('New flag value:', newFlag);

        try {
            // Save to backend
            await auditAPI.flagBid(tenderId, bidId, newFlag);
            console.log('Flag saved to backend successfully');

            // Update local state
            setBidFlags(prev => {
                const updated = {
                    ...prev,
                    [bidId]: newFlag
                };
                console.log('Updated bidFlags state:', updated);
                return updated;
            });
        } catch (error) {
            console.error('Error saving flag:', error);
            alert('Failed to save flag. Please try again.');
        }
    };

    const submitAuditReview = async (tenderId) => {
        console.log('submitAuditReview called for tender:', tenderId);

        console.log('Proceeding with submission...');
        setSubmitting(true);
        try {
            console.log('Calling auditAPI.submitReview...');
            const response = await auditAPI.submitReview(tenderId, 'Audit review completed');
            console.log('Submit response:', response.data);

            // Update submission status
            setAuditSubmissions(prev => ({
                ...prev,
                [tenderId]: {
                    submitted: true,
                    submittedAt: response.data.audit.submittedAt,
                    submittedBy: response.data.audit.submittedBy
                }
            }));

            console.log('Submission successful!');
            alert('✅ Audit review submitted successfully!');
        } catch (error) {
            console.error('Error submitting audit:', error);
            console.error('Error details:', error.response?.data);
            alert('❌ ' + (error.response?.data?.error || 'Failed to submit audit review'));
        } finally {
            setSubmitting(false);
            console.log('Submission process complete');
        }
    };

    if (loading) {
        return <div className="loading">Loading audit data...</div>;
    }

    if (showBlockchain) {
        return (
            <div className="blockchain-explorer">
                <h2>⛓️ Blockchain Explorer</h2>

                <div className="grid">
                    <div className="stat-card">
                        <h4>Total Blocks</h4>
                        <div className="value">{blockchain?.length || 0}</div>
                    </div>
                    <div className="stat-card">
                        <h4>Chain Status</h4>
                        <div className="value">✅ VALID</div>
                    </div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Blockchain Ledger</h3>
                {blockchain?.chain?.map((block) => (
                    <div key={block.index} className="block">
                        <div className="block-header">
                            <span>Block #{block.index} - {block.type}</span>
                            <span>{new Date(block.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="block-hash">
                            <strong>Hash:</strong> {block.hash}
                        </div>
                        <div className="block-hash">
                            <strong>Previous Hash:</strong> {block.previousHash}
                        </div>
                        <div className="block-hash">
                            <strong>MSP:</strong> {block.mspId}
                        </div>
                        <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer', color: '#667eea', fontWeight: '600' }}>
                                View Data
                            </summary>
                            <pre style={{ marginTop: '10px', background: '#fff', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                                {JSON.stringify(block.data, null, 2)}
                            </pre>
                        </details>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <h2>🔍 Auditor Dashboard</h2>

            <div className="grid">
                <div className="stat-card">
                    <h4>Total Tenders</h4>
                    <div className="value">{tenders.length}</div>
                </div>
                <div className="stat-card">
                    <h4>Total Bids</h4>
                    <div className="value">{bids.length}</div>
                </div>
                <div className="stat-card">
                    <h4>Contracts Awarded</h4>
                    <div className="value">{contracts.length}</div>
                </div>
                <div className="stat-card">
                    <h4>Manually Flagged</h4>
                    <div className="value" style={{ color: '#ef4444' }}>
                        {Object.values(bidFlags).filter(f => f).length}
                    </div>
                </div>
            </div>

            <h3 style={{ marginTop: '40px', marginBottom: '15px' }}>📋 All Procurement Activities</h3>
            {tenders.map((tender) => {
                const tenderBids = bids.filter(b => b.tenderId === tender.id);
                const tenderContract = contracts.find(c => c.tenderId === tender.id);
                const isExpanded = expandedTender === tender.id;

                return (
                    <div key={tender.id} className="card" style={{
                        cursor: tenderBids.length > 0 ? 'pointer' : 'default',
                        borderColor: isExpanded ? 'var(--primary)' : 'var(--gray-300)'
                    }}
                        onClick={() => tenderBids.length > 0 && setExpandedTender(isExpanded ? null : tender.id)}
                    >
                        <h3>
                            {tender.title}
                            {tenderBids.length > 0 && (
                                <span style={{ fontSize: '0.875rem', marginLeft: '0.75rem', color: 'var(--gray-600)' }}>
                                    {isExpanded ? '▼ Click to collapse' : `▶ Click to view ${tenderBids.length} bid(s)`}
                                </span>
                            )}
                        </h3>
                        <p><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                        <p><strong>Bids Received:</strong> {tenderBids.length}</p>

                        {/* Expandable bid details section */}
                        {isExpanded && tenderBids.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                                    📊 Bid Details & Manual Review
                                </h4>
                                {tenderBids.map((bid, index) => {
                                    const flagStatus = bidFlags[bid.id];
                                    return (
                                        <div key={bid.id} style={{
                                            padding: '1rem',
                                            background: flagStatus === 'FLAGGED' ? '#FEF3C7' :
                                                flagStatus === 'APPROVED' ? '#D1FAE5' : 'var(--gray-50)',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.75rem',
                                            border: `2px solid ${flagStatus === 'FLAGGED' ? '#F59E0B' :
                                                flagStatus === 'APPROVED' ? '#10B981' : 'var(--gray-300)'}`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <strong style={{ fontSize: '1.05rem' }}>
                                                        {bid.vendorName || bid.vendorEmail}
                                                    </strong>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {flagStatus && (
                                                        <span className="badge" style={{
                                                            background: flagStatus === 'FLAGGED' ? '#F59E0B' : '#10B981'
                                                        }}>
                                                            {flagStatus === 'FLAGGED' ? '⚠️ FLAGGED' : '✅ APPROVED'}
                                                        </span>
                                                    )}
                                                    <span className="badge" style={{ background: 'var(--secondary)' }}>
                                                        Bid #{index + 1}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                <p><strong>Amount:</strong> ₹{bid.amount.toLocaleString()}</p>
                                                <p><strong>Timeline:</strong> {bid.timeline}</p>
                                                <p><strong>Proposal:</strong> {bid.proposal}</p>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                                                    Submitted: {new Date(bid.submittedAt).toLocaleString()}
                                                </p>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                                                    🔗 Block #{bid.blockIndex}
                                                </p>
                                            </div>

                                            {/* Manual Review Buttons */}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-300)' }}>
                                                <button
                                                    onClick={() => toggleBidFlag(tender.id, bid.id, 'APPROVED')}
                                                    className={flagStatus === 'APPROVED' ? 'btn-success' : 'btn-secondary'}
                                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                                    disabled={auditSubmissions[tender.id]?.submitted}
                                                >
                                                    {flagStatus === 'APPROVED' ? '✅ Approved' : '✓ Approve'}
                                                </button>
                                                <button
                                                    onClick={() => toggleBidFlag(tender.id, bid.id, 'FLAGGED')}
                                                    className={flagStatus === 'FLAGGED' ? 'btn-warning' : 'btn-secondary'}
                                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                                    disabled={auditSubmissions[tender.id]?.submitted}
                                                >
                                                    {flagStatus === 'FLAGGED' ? '⚠️ Flagged' : '⚠ Flag for Review'}
                                                </button>
                                                {flagStatus && (
                                                    <button
                                                        onClick={() => toggleBidFlag(tender.id, bid.id, null)}
                                                        className="btn-secondary"
                                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                                        disabled={auditSubmissions[tender.id]?.submitted}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Submit Review Section */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    paddingTop: '1.5rem',
                                    borderTop: '2px solid var(--gray-300)'
                                }}>
                                    {auditSubmissions[tender.id]?.submitted ? (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#D1FAE5',
                                            borderRadius: '0.5rem',
                                            border: '2px solid #10B981'
                                        }}>
                                            <p style={{ margin: 0, fontWeight: '600', color: '#065F46' }}>
                                                ✅ Audit Review Submitted
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
                                                Submitted by {auditSubmissions[tender.id].submittedBy} on{' '}
                                                {new Date(auditSubmissions[tender.id].submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: '#FEF3C7',
                                                borderRadius: '0.5rem',
                                                border: '2px solid #F59E0B',
                                                marginBottom: '1rem'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400E', fontWeight: '600' }}>
                                                    ⚠️ Warning: Once submitted, you cannot modify your audit decisions
                                                </p>
                                            </div>
                                            <p style={{ marginBottom: '1rem', color: 'var(--gray-700)' }}>
                                                Review all bids above and submit your audit decision.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    console.log('Submit button clicked for tender:', tender.id);
                                                    console.log('Current bidFlags:', bidFlags);
                                                    console.log('Tender bids:', tenderBids);
                                                    submitAuditReview(tender.id);
                                                }}
                                                className="btn-primary"
                                                disabled={
                                                    submitting ||
                                                    !tenderBids.some(bid => {
                                                        const hasFlag = !!bidFlags[bid.id];
                                                        console.log(`Bid ${bid.id} has flag:`, hasFlag, bidFlags[bid.id]);
                                                        return hasFlag;
                                                    })
                                                }
                                                style={{ width: '100%' }}
                                            >
                                                {submitting ? 'Submitting...' :
                                                    !tenderBids.some(bid => bidFlags[bid.id]) ?
                                                        '📝 Review at least one bid to submit' :
                                                        '📝 Submit Audit Review'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {tenderContract && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--secondary-light)', borderRadius: '0.5rem' }}>
                                <p><strong>✅ Contract Awarded To:</strong> {tenderContract.winningBid.vendorName} (₹{tenderContract.winningBid.amount.toLocaleString()})</p>
                            </div>
                        )}

                        <p style={{ fontSize: '12px', color: '#666', marginTop: '1rem' }}>
                            Block #{tender.blockIndex} | Hash: {tender.blockHash.substring(0, 32)}...
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

export default AuditorTab;

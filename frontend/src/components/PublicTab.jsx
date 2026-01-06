import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function PublicTab() {
    const [tenders, setTenders] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPublicData();
    }, []);

    const loadPublicData = async () => {
        try {
            // Use public endpoints (no auth required)
            const [tendersRes, contractsRes] = await Promise.all([
                axios.get(`${API_URL}/public/tenders`),
                axios.get(`${API_URL}/public/contracts`)
            ]);

            console.log('Tenders loaded:', tendersRes.data);
            console.log('Contracts loaded:', contractsRes.data);

            setTenders(tendersRes.data.tenders || []);
            setContracts(contractsRes.data.contracts || []);
        } catch (error) {
            console.error('Error loading public data:', error);
            setTenders([]);
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading public data...</div>;
    }

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: 'var(--gray-900)'
                }}>
                    <span style={{ fontSize: '2rem' }}>🌐</span>
                    Public Transparency Portal
                </h2>
                <p style={{
                    color: 'var(--gray-600)',
                    fontSize: '1rem',
                    lineHeight: '1.5'
                }}>
                    View all public procurement activities recorded on the blockchain
                </p>
            </div>

            {/* Broadcast Announcements - Recent Contract Awards */}
            {contracts.length > 0 && (
                <div style={{
                    marginBottom: '2.5rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                    borderRadius: '0.75rem',
                    border: '2px solid #3B82F6',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📢</span>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#1E40AF'
                        }}>
                            Latest Contract Awards
                        </h3>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        {contracts.slice(0, 3).map((contract, index) => (
                            <div key={contract.id} style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '0.5rem',
                                border: '1px solid #93C5FD',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <span style={{
                                    fontSize: '1.5rem',
                                    minWidth: '2rem',
                                    textAlign: 'center'
                                }}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#1F2937'
                                    }}>
                                        <strong style={{ color: '#1E40AF' }}>{contract.tenderTitle}</strong>
                                        {' '}awarded to{' '}
                                        <strong style={{ color: '#059669' }}>{contract.winningBid.vendorName}</strong>
                                    </p>
                                    <p style={{
                                        margin: '0.25rem 0 0 0',
                                        fontSize: '0.875rem',
                                        color: '#6B7280'
                                    }}>
                                        Contract Value: <strong>₹{contract.winningBid.amount.toLocaleString()}</strong>
                                        {' • '}
                                        Awarded on {new Date(contract.awardedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {contracts.length > 3 && (
                        <p style={{
                            marginTop: '1rem',
                            marginBottom: 0,
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            color: '#1E40AF',
                            fontWeight: '600'
                        }}>
                            + {contracts.length - 3} more contract{contracts.length - 3 > 1 ? 's' : ''} awarded
                        </p>
                    )}
                </div>
            )}

            {/* Statistics Grid */}
            <div className="grid" style={{ marginBottom: '3rem' }}>
                <div className="stat-card">
                    <h4>📊 Total Tenders</h4>
                    <div className="value">{tenders.length}</div>
                </div>
                <div className="stat-card">
                    <h4>📂 Open Tenders</h4>
                    <div className="value">{tenders.filter(t => t.status === 'OPEN').length}</div>
                </div>
                <div className="stat-card">
                    <h4>✅ Contracts Awarded</h4>
                    <div className="value">{contracts.length}</div>
                </div>
                <div className="stat-card">
                    <h4>💰 Total Value</h4>
                    <div className="value" style={{ fontSize: '1.75rem' }}>
                        ₹{(tenders.reduce((sum, t) => sum + t.budget, 0) / 10000000).toFixed(1)}Cr
                    </div>
                </div>
            </div>

            {/* Active Tenders Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--gray-900)'
                }}>
                    <span>📜</span> Active Tenders
                </h3>

                {tenders.filter(t => t.status === 'OPEN').length > 0 ? (
                    tenders.filter(t => t.status === 'OPEN').map((tender) => (
                        <div key={tender.id} className="card">
                            <h3>
                                {tender.title}
                                <span className="badge open">OPEN</span>
                            </h3>
                            <p>{tender.description}</p>
                            <p><strong>Budget:</strong> ₹{tender.budget.toLocaleString()}</p>
                            <p><strong>Deadline:</strong> {tender.deadline}</p>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: 'var(--gray-500)',
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--gray-200)'
                            }}>
                                🔗 Blockchain Verified | Block #{tender.blockIndex}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No open tenders at the moment</p>
                    </div>
                )}
            </div>

            {/* Awarded Contracts Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--gray-900)'
                }}>
                    <span>✅</span> Awarded Contracts
                </h3>

                {contracts.length > 0 ? (
                    contracts.map((contract) => (
                        <div key={contract.id} className="card">
                            <h3>
                                {contract.tenderTitle}
                                <span className="badge awarded">AWARDED</span>
                            </h3>
                            <p><strong>Awarded To:</strong> {contract.winningBid.vendorName}</p>
                            <p><strong>Contract Value:</strong> ₹{contract.winningBid.amount.toLocaleString()}</p>
                            <p><strong>Timeline:</strong> {contract.winningBid.timeline}</p>
                            <p><strong>Awarded On:</strong> {new Date(contract.awardedAt).toLocaleDateString()}</p>
                            <p style={{
                                fontSize: '0.8125rem',
                                color: 'var(--gray-500)',
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--gray-200)'
                            }}>
                                🔗 Blockchain Verified | Block #{contract.blockIndex} | Hash: {contract.blockHash.substring(0, 16)}...
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No contracts awarded yet</p>
                    </div>
                )}
            </div>

            {/* Transparency Info Card */}
            <div className="card" style={{
                background: 'var(--primary-light)',
                borderColor: 'var(--primary)',
                marginTop: '3rem'
            }}>
                <h3 style={{
                    color: 'var(--primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <span>🛡️</span> Transparency & Accountability
                </h3>
                <p style={{
                    marginBottom: '1rem',
                    color: 'var(--gray-700)',
                    lineHeight: '1.6'
                }}>
                    All procurement activities are recorded on an immutable blockchain ledger, ensuring:
                </p>
                <ul style={{
                    marginLeft: '1.5rem',
                    color: 'var(--gray-700)',
                    lineHeight: '1.8'
                }}>
                    <li>✅ Complete transparency in tender processes</li>
                    <li>✅ Tamper-proof record of all bids and awards</li>
                    <li>✅ AI-powered anomaly detection for corruption prevention</li>
                    <li>✅ Public auditability of government spending</li>
                </ul>
                <p style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--primary)',
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                }}>
                    <strong>SDG Alignment:</strong> SDG-16 (Peace, Justice & Strong Institutions) | SDG-17 (Partnerships for the Goals)
                </p>
            </div>
        </div>
    );
}

export default PublicTab;

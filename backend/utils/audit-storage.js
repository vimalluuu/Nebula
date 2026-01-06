// In-memory storage for audit reviews
// In production, this would be replaced with a database

const auditReviews = new Map();

class AuditStorage {
    // Initialize audit review for a tender
    initializeAudit(tenderId) {
        if (!auditReviews.has(tenderId)) {
            auditReviews.set(tenderId, {
                bidFlags: {},
                submitted: false,
                submittedAt: null,
                submittedBy: null,
                notes: ''
            });
        }
        return auditReviews.get(tenderId);
    }

    // Save a bid flag (APPROVED/FLAGGED/null)
    saveBidFlag(tenderId, bidId, flag) {
        const audit = this.initializeAudit(tenderId);

        if (audit.submitted) {
            throw new Error('Cannot modify audit after submission');
        }

        if (flag === null) {
            delete audit.bidFlags[bidId];
        } else {
            audit.bidFlags[bidId] = flag;
        }

        return audit;
    }

    // Get bid flags for a tender
    getBidFlags(tenderId) {
        const audit = auditReviews.get(tenderId);
        return audit ? audit.bidFlags : {};
    }

    // Submit audit review
    submitAudit(tenderId, auditorEmail, notes = '') {
        const audit = this.initializeAudit(tenderId);

        if (audit.submitted) {
            throw new Error('Audit already submitted');
        }

        audit.submitted = true;
        audit.submittedAt = new Date().toISOString();
        audit.submittedBy = auditorEmail;
        audit.notes = notes;

        return audit;
    }

    // Get audit status for a tender
    getAuditStatus(tenderId) {
        const audit = auditReviews.get(tenderId);

        if (!audit) {
            return {
                submitted: false,
                submittedAt: null,
                submittedBy: null,
                approvedBids: 0,
                flaggedBids: 0,
                totalBids: 0,
                canAwardContract: false,
                bidFlags: {}
            };
        }

        const approvedBids = Object.values(audit.bidFlags).filter(f => f === 'APPROVED').length;
        const flaggedBids = Object.values(audit.bidFlags).filter(f => f === 'FLAGGED').length;
        const totalBids = Object.keys(audit.bidFlags).length;

        return {
            submitted: audit.submitted,
            submittedAt: audit.submittedAt,
            submittedBy: audit.submittedBy,
            approvedBids,
            flaggedBids,
            totalBids,
            canAwardContract: audit.submitted && flaggedBids === 0,
            bidFlags: audit.bidFlags,
            notes: audit.notes
        };
    }

    // Get all audit reviews (for debugging)
    getAllAudits() {
        return Array.from(auditReviews.entries()).map(([tenderId, audit]) => ({
            tenderId,
            ...audit
        }));
    }

    // Clear audit for a tender (for testing)
    clearAudit(tenderId) {
        auditReviews.delete(tenderId);
    }

    // Clear all audit data (for testing)
    clearAll() {
        auditReviews.clear();
        console.log('All audit data cleared');
    }
}

module.exports = new AuditStorage();

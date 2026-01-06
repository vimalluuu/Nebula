# 🏛️ Corruption-Resistant Public Procurement Monitoring System

## 24-Hour Hackathon Prototype

A blockchain-based platform for transparent, tamper-resistant public procurement aligned with **SDG-16** (Peace, Justice & Strong Institutions) and **SDG-17** (Partnerships for the Goals).

---

## 🎯 Project Overview

This system demonstrates how blockchain technology and AI can prevent corruption in public procurement by ensuring:

- ✅ **Immutable Record-Keeping**: All procurement activities recorded on blockchain
- ✅ **Transparency**: Public access to tender and contract information
- ✅ **AI-Powered Anomaly Detection**: Automatic flagging of suspicious bidding patterns
- ✅ **Role-Based Access Control**: Different views for government, vendors, auditors, and public
- ✅ **Complete Audit Trail**: Every transaction traceable with blockchain verification

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Government | Vendor | Auditor | Public Dashboards)   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Node.js Backend API (Port 5000)            │
│  • Tender Management  • Bid Processing                  │
│  • Contract Awards    • Blockchain Simulator            │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
    ┌────────┴────────┐      ┌───────┴──────────┐
    │  Blockchain     │      │  AI Service      │
    │  Simulator      │      │  (Port 5001)     │
    │  (In-Memory)    │      │  Flask + ML      │
    └─────────────────┘      └──────────────────┘
```

### Technology Stack

- **Frontend**: React 18 + Vite, Chart.js for visualizations
- **Backend**: Node.js + Express, JWT authentication
- **Blockchain**: JavaScript simulation with SHA-256 hashing
- **AI/ML**: Python Flask, scikit-learn (Isolation Forest)
- **Storage**: In-memory (for rapid prototyping)

---

## 🚀 Quick Start Guide

### 🐳 Option 1: Docker Deployment (Recommended)

Run the entire stack with a single command:
```bash
docker-compose up --build
```
- **App URL**: `http://localhost`
- **Documentation**: See [DOCKER.md](DOCKER.md) for detailed guide.

### 🛠️ Option 2: Manual Installation

#### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- npm or yarn

#### Setup Steps

1. **Clone and navigate to project**
   ```bash
   cd "c:\Users\Rohith\Music\VIR 3"
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Install AI Service Dependencies**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   cd ..
   ```

5. **Create Environment File**
   ```bash
   copy .env.example .env
   ```

#### Running the Application

You need to run **3 services** in separate terminals:

**Terminal 1: Backend API**
```bash
cd backend
node server.js
```
Server runs on `http://localhost:5000`

**Terminal 2: AI Service**
```bash
cd ai-service
python app.py
```
Service runs on `http://localhost:5001`

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:3000`

### Seed Sample Data (Optional but Recommended)

In a new terminal:
```bash
cd backend
node seed.js
```

This creates:
- 5 sample tenders
- 15 bids (including 3 with anomalous patterns)
- 1 awarded contract

---

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Government Official** | gov@demo.com | demo123 |
| **Vendor 1** | vendor1@demo.com | demo123 |
| **Vendor 2** | vendor2@demo.com | demo123 |
| **Vendor 3** | vendor3@demo.com | demo123 |
| **Auditor** | auditor@demo.com | demo123 |
| **Public User** | public@demo.com | demo123 |

---

## 📖 User Guide

### 🏛️ Government Dashboard

**Features:**
- Create new procurement tenders
- View all submitted bids for each tender
- See bid comparison charts
- Award contracts to winning bidders
- All actions recorded on blockchain

**Demo Flow:**
1. Login as `gov@demo.com`
2. Click "Create Tender"
3. Fill in tender details (title, budget, deadline, requirements)
4. Submit to add to blockchain
5. View bids submitted by vendors
6. Award contract to best bid

### 🏢 Vendor Dashboard

**Features:**
- Browse open tenders
- Submit bids with proposal and timeline
- View bid status
- See AI risk feedback (if bid is flagged)
- Track all submitted bids

**Demo Flow:**
1. Login as `vendor1@demo.com`
2. Browse available tenders
3. Click "Submit Bid" on a tender
4. Enter bid amount, proposal, and timeline
5. Submit bid (recorded on blockchain)
6. View bid status in "My Submitted Bids"

### 🔍 Auditor Dashboard

**Features:**
- View all procurement activities
- See AI anomaly detection results
- Risk scores for each tender
- Detailed flags (identical bids, price outliers, timing patterns)
- Blockchain explorer with full chain verification
- Complete audit trail

**Demo Flow:**
1. Login as `auditor@demo.com`
2. View AI Anomaly Detection Results
3. Check risk scores and explanations
4. Review flagged issues (collusion, outliers, etc.)
5. Switch to "Blockchain" tab to verify chain integrity
6. Inspect individual blocks and transactions

### 🌐 Public Portal

**Features:**
- View all open tenders (read-only)
- See awarded contracts
- Blockchain verification for transparency
- Statistics on procurement activities
- SDG impact information

**Demo Flow:**
1. Login as `public@demo.com`
2. Browse active tenders
3. View awarded contracts
4. See blockchain verification badges
5. Access transparency statistics

---

## 🤖 AI Anomaly Detection

The system uses a **hybrid detection approach**:

### Rule-Based Detection
- **Identical Bids**: Flags multiple bids with same amount (possible collusion)
- **Price Outliers**: Detects bids >2 standard deviations from mean
- **Suspicious Low Bids**: Flags bids <50% of average (potential underbidding)
- **Timing Patterns**: Detects bids submitted within 1 minute (coordination)

### ML-Based Detection
- **Isolation Forest**: Unsupervised learning to detect anomalous bid patterns
- **Feature Engineering**: Bid amount, deviation from mean, timing analysis

### Explainable AI
- Risk score (0-100) for each tender
- Human-readable explanations
- Bid-level analysis with individual risk levels
- Severity classification (HIGH/MEDIUM/LOW)

---

## ⛓️ Blockchain Features

### Immutability
- SHA-256 hash chaining
- Tamper-proof blocks
- Previous hash verification

### Block Types
- **TENDER**: Tender creation
- **BID**: Bid submission
- **CONTRACT**: Contract award
- **PAYMENT**: Fund disbursement (future)

### MSP-Based Access Control
- **AgenciesMSP**: Government entities
- **VendorsMSP**: Bidders/suppliers
- **AuditorsMSP**: Independent auditors
- **PublicMSP**: Citizens (read-only)

### Verification
- Full chain validation
- Block hash verification
- Transaction traceability

---

## 📊 Demo Scenarios

### Scenario 1: Normal Procurement Flow
1. Government creates "School Furniture Supply" tender
2. 3 vendors submit competitive bids
3. AI analysis shows low risk (normal distribution)
4. Government awards to lowest bidder
5. Contract recorded on blockchain

### Scenario 2: Anomaly Detection
1. Government creates "Highway Construction" tender
2. Vendor 1 bids ₹48M
3. Vendor 3 bids ₹48M (identical - **FLAGGED**)
4. AI detects collusion pattern
5. Auditor reviews high-risk alert
6. Investigation triggered before award

### Scenario 3: Public Transparency
1. Public user views all open tenders
2. Sees awarded contracts with blockchain verification
3. Verifies no tampering via blockchain explorer
4. Downloads audit reports

---

## 🎯 SDG Alignment

### SDG-16: Peace, Justice & Strong Institutions

**Target 16.5**: Substantially reduce corruption and bribery
- ✅ Blockchain prevents bid manipulation
- ✅ AI detects corruption patterns
- ✅ Immutable audit trail

**Target 16.6**: Develop effective, accountable institutions
- ✅ Transparent procurement processes
- ✅ Public accountability
- ✅ Role-based governance

**Target 16.7**: Ensure responsive, inclusive decision-making
- ✅ Public access to procurement data
- ✅ Multi-stakeholder participation
- ✅ Fair bidding process

### SDG-17: Partnerships for the Goals

**Target 17.16**: Enhance global partnership
- ✅ Technology-enabled collaboration
- ✅ Knowledge sharing via open platform
- ✅ Multi-sector engagement (government, vendors, auditors, public)

**Target 17.17**: Encourage effective partnerships
- ✅ Public-private collaboration
- ✅ Transparent vendor relationships
- ✅ Stakeholder trust through technology

---

## 🏆 Key Features for Hackathon Judges

1. **✅ Full-Stack Implementation**: React + Node.js + Python
2. **✅ Blockchain Simulation**: SHA-256 hashing, immutability, chain validation
3. **✅ AI/ML Integration**: Isolation Forest + rule-based hybrid detection
4. **✅ Explainable AI**: Human-readable risk scores and explanations
5. **✅ Role-Based Dashboards**: 4 distinct user experiences
6. **✅ Real-Time Visualizations**: Chart.js bid comparison charts
7. **✅ Blockchain Explorer**: Full chain inspection and verification
8. **✅ Sample Data**: Realistic scenarios with anomalous patterns
9. **✅ Modern UI/UX**: Gradient design, glassmorphism, responsive
10. **✅ SDG Impact**: Clear alignment with SDG-16 and SDG-17

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Tenders
- `GET /api/tenders` - List all tenders
- `GET /api/tenders/:id` - Get tender by ID
- `POST /api/tenders` - Create tender (Government only)

### Bids
- `POST /api/bids` - Submit bid (Vendors only)
- `GET /api/bids/tender/:tenderId` - Get bids for tender

### Contracts
- `POST /api/contracts/award` - Award contract (Government only)
- `GET /api/contracts` - List all contracts

### Blockchain
- `GET /api/blockchain` - Get full blockchain
- `GET /api/blockchain/validate` - Validate chain integrity

---

## 🎬 Presentation Demo Script

### Opening (30 seconds)
"We've built a corruption-resistant procurement platform using blockchain and AI. Let me show you how it prevents bid rigging and ensures transparency."

### Demo Flow (3 minutes)

**1. Government Creates Tender** (30s)
- Login as government
- Create "IT Equipment" tender
- Show blockchain confirmation

**2. Vendors Submit Bids** (45s)
- Login as vendor1, submit normal bid
- Login as vendor2, submit identical bid (anomaly)
- Show blockchain recording

**3. AI Detects Anomaly** (45s)
- Login as auditor
- Show AI risk score (HIGH)
- Explain "identical bids" flag
- Show bid comparison chart

**4. Public Verification** (30s)
- Login as public user
- Show transparency portal
- Verify blockchain integrity

**5. Blockchain Explorer** (30s)
- Show full chain
- Verify hash linkage
- Demonstrate immutability

### Closing (30 seconds)
"This system aligns with SDG-16 by reducing corruption and SDG-17 by enabling transparent partnerships. All code is production-ready and scalable."

---

## 🚧 Future Enhancements (Post-Hackathon)

- [ ] Deploy to Hyperledger Fabric for production
- [ ] PostgreSQL for persistent storage
- [ ] Advanced ML models (LOF, ensemble methods)
- [ ] Email notifications for bid updates
- [ ] PDF report generation
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Smart contract automation
- [ ] Integration with government e-procurement systems

---

## 📝 Technical Notes

### Blockchain Simulation
- Uses SHA-256 for cryptographic hashing
- Implements proof-of-existence (not proof-of-work)
- Suitable for permissioned networks
- Can be migrated to Hyperledger Fabric

### AI Model
- Isolation Forest with 20% contamination rate
- Rule-based detection for known patterns
- Explainable outputs for auditor review
- Can be retrained with real procurement data

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- CORS enabled for development
- Input validation on all endpoints

---

## 👥 Team & Credits

**Developed for**: 24-Hour National-Level Hackathon
**Theme**: SDG-16 & SDG-17 - Corruption Prevention & Partnerships
**Tech Stack**: MERN + Python + Blockchain + AI/ML

---

## 📄 License

MIT License - Free for educational and demonstration purposes

---

## 🙏 Acknowledgments

- **SDG Framework**: United Nations Sustainable Development Goals
- **Blockchain Inspiration**: Hyperledger Fabric architecture
- **AI/ML**: scikit-learn community
- **UI Design**: Modern web design best practices

---

## 📞 Support

For demo questions or technical issues during hackathon:
- Check browser console for errors
- Ensure all 3 services are running
- Verify ports 3000, 5000, 5001 are available
- Run seed script for sample data

---

**🎉 Ready to Demo! Good luck with your hackathon presentation! 🚀**
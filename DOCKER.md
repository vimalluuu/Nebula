# 🐳 Complete Docker Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                 (procurement-network)                    │
│                                                          │
│  ┌──────────────────┐         ┌────────────────────┐   │
│  │    Frontend      │         │     Backend        │   │
│  │   (nginx:80)     │────────▶│   (node:5000)      │   │
│  │                  │   API   │                    │   │
│  │  All Portals:    │         │  Blockchain API    │   │
│  │  - Public        │         │  - Tenders         │   │
│  │  - Government    │         │  - Bids            │   │
│  │  - Vendor        │         │  - Contracts       │   │
│  │  - Auditor       │         │  - Blockchain      │   │
│  └──────────────────┘         └────────────────────┘   │
│                                        │                │
│                                        ▼                │
│                              ┌──────────────────┐       │
│                              │  Shared Storage  │       │
│                              │  - Vendors       │       │
│                              │  - Blockchain    │       │
│                              └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## How All Portals Connect to Blockchain

### 1. Single Backend Instance
- **One blockchain instance** shared across all portals
- All portals connect to the same backend API
- Blockchain state is synchronized automatically

### 2. Portal Access Flow

**Public Portal** (No Auth Required)
```
Browser → Frontend (/) → Backend API → Blockchain
         Public View     GET /tenders   Read blocks
                        GET /contracts  Read blocks
```

**Government Portal** (After Login)
```
Browser → Frontend (/) → Backend API → Blockchain
         Gov Dashboard   POST /tenders  Add blocks
                        POST /contracts Add blocks
                        (JWT: gov role)
```

**Vendor Portal** (After Login/Signup)
```
Browser → Frontend (/) → Backend API → Blockchain
         Vendor Dashboard POST /bids    Add blocks
                         GET /tenders   Read blocks
                         (JWT: vendor role)
```

**Auditor Portal** (After Login)
```
Browser → Frontend (/) → Backend API → Blockchain
         Auditor Dashboard GET /blockchain  Read all
                          GET /tenders      Read all
                          GET /bids         Read all
                          (JWT: auditor role)
```

## Quick Start

### 1. Build and Run Everything

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Access All Portals

All portals are served from the same URL:

- **Public Portal**: http://localhost (no login)
- **Government Portal**: http://localhost → Login with gov@demo.com
- **Vendor Portal**: http://localhost → Login/Signup as vendor
- **Auditor Portal**: http://localhost → Login with auditor@demo.com

### 3. Verify Blockchain Sync

```bash
# Check backend logs
docker-compose logs -f backend

# You should see:
# ✅ Auto-seeded 3 sample tenders
# 📦 Blockchain initialized with genesis block
```

## How Blockchain Synchronization Works

### In-Memory Blockchain (Current)
- Blockchain stored in backend memory
- All API calls go to same backend instance
- All portals see same blockchain state
- **Limitation**: Data lost on restart (auto-seeds on startup)

### With Persistent Storage (Optional)
To persist blockchain data across restarts:

1. Modify `backend/server.js` to save blockchain to file
2. Load blockchain from file on startup
3. Volume `blockchain-data` already configured

## Docker Commands

### View All Services
```bash
docker-compose ps
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart backend
```

### Stop Everything
```bash
# Stop services
docker-compose down

# Stop and remove volumes (clear all data)
docker-compose down -v
```

## Testing Blockchain Sync

### Test 1: Create Tender (Government)
1. Open http://localhost
2. Login as gov@demo.com / demo123
3. Create a new tender
4. **Blockchain updated** ✅

### Test 2: View Tender (Public)
1. Logout
2. Go to http://localhost (public view)
3. **New tender visible** ✅
4. **Blockchain synced** ✅

### Test 3: Submit Bid (Vendor)
1. Login as vendor or signup new vendor
2. View open tenders
3. Submit a bid
4. **Blockchain updated** ✅

### Test 4: Audit Trail (Auditor)
1. Login as auditor@demo.com / demo123
2. View blockchain explorer
3. **All blocks visible** ✅
4. **Complete audit trail** ✅

## Environment Variables

Create `.env` file:

```env
# Backend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
PORT=5000

# Frontend (built into image)
VITE_API_URL=http://localhost:5000/api
```

## Production Deployment

### 1. Update Configuration
```bash
# Update .env with production values
JWT_SECRET=<strong-random-secret>
```

### 2. Build Images
```bash
docker-compose build
```

### 3. Deploy
```bash
docker-compose up -d
```

### 4. Monitor
```bash
# Check health
docker-compose ps

# View logs
docker-compose logs -f
```

## Persistent Data

### Vendor Registrations
- Stored in: `procurement-storage` volume
- Location: `/app/storage/vendors.json`
- **Persists across restarts** ✅

### Blockchain Data
- Currently: In-memory (auto-seeds on startup)
- Volume ready: `procurement-blockchain`
- To enable persistence: Modify server.js to save/load blockchain

## Backup and Restore

### Backup Vendor Data
```bash
docker run --rm \
  -v procurement-storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/vendors-backup.tar.gz -C /data .
```

### Restore Vendor Data
```bash
docker run --rm \
  -v procurement-storage:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/vendors-backup.tar.gz -C /data
```

## Scaling (Future)

To scale for high availability:

```bash
# Scale backend (requires load balancer)
docker-compose up -d --scale backend=3

# Note: Blockchain sync requires Redis or database
```

## Troubleshooting

### Portals not syncing
```bash
# Check backend is running
docker-compose ps backend

# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Cannot access frontend
```bash
# Check nginx
docker-compose logs frontend

# Verify port mapping
docker-compose ps
```

### Blockchain not persisting
This is expected - blockchain auto-seeds on startup.
To enable persistence, modify `backend/server.js`.

## Health Checks

Both services have health checks:

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost/health
```

## Network Architecture

All services on `procurement-network`:
- Frontend can reach backend via `http://backend:5000`
- Backend isolated from external access (only via frontend proxy)
- Secure internal communication

## Summary

✅ **All portals** (Public, Government, Vendor, Auditor) in **one frontend container**  
✅ **One blockchain** in **one backend container**  
✅ **All portals synced** via **shared API**  
✅ **Docker networking** ensures **secure communication**  
✅ **Persistent storage** for **vendor data**  
✅ **Auto-seeding** ensures **demo data** always available  
✅ **Health checks** for **reliability**  
✅ **Production-ready** with **security headers**

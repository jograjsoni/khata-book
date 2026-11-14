# Khata Ledger Backend API

[![CI Status](https://github.com/your-username/khata-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/khata-backend/actions)
![Node Version](https://img.shields.io/badge/node-%3E%3D22.13.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Production-grade RESTful API and synchronization engine for the **Khata** ledger application. Built with Node.js, Express, TypeScript, and hardened for high-throughput financial transactions, zero data-loss offline sync, cryptographic ledger hashing, and strict security rate limiting.

---

## Key Features

- **Cryptographic Ledger Integrity**: Every transaction generates a SHA-256 chained audit hash linking back to the previous entry, preventing ledger tampering.
- **Dual-Storage Resilience**: Seamless hybrid storage engine supporting MongoDB with automated fallback to persistent atomic disk storage when offline or database is unreachable.
- **High-Resilience Windows File-Lock Handling**: Disk persistence implements randomized exponential backoff retries to prevent `EBUSY` and `EPERM` lock collisions.
- **Idempotent Sync Engine**: Preserves mobile client UUIDs (`partyId`, `txnId`, `cashbookId`) during offline syncing and rejects duplicated replay requests without double-counting balances.
- **Hardened Security & Rate Limiting**: Dual-tier rate limiting (100 req/15min general API, 10 req/15min strict auth limiter) with RFC-compliant `Retry-After` headers and strict JWT cryptographic verification.
- **Firebase & Dev Auth**: Supports both Firebase Admin ID token verification and dev fallback authentication.

---

## Directory Structure

```
backend/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI pipeline
├── data/
│   └── .gitkeep                 # Persistent local storage directory
├── src/
│   ├── middleware/
│   │   └── auth.ts              # JWT verification and rate limiting middleware
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication (Login, Signup, Google, Forgot PW)
│   │   ├── cashbook.routes.ts   # Daily cash in/out management & sync
│   │   ├── party.routes.ts      # Customer/Supplier party management & sync
│   │   ├── report.routes.ts     # Analytics, PDF statement summaries, weekly cashflow
│   │   └── transaction.routes.ts# Financial transactions & cryptographic hash chaining
│   ├── services/
│   │   └── storageService.ts    # Dual MongoDB/Disk storage, hash chain & mutex lock
│   └── server.ts                # Express app initialization, routing, crash handlers
├── .env.example                 # Production environment template
├── .gitignore                   # Hardened git ignore definitions
├── package.json                 # Project dependencies and npm scripts
├── test_api.js                  # Comprehensive API integration test
├── test_security.js             # Security, JWT tamper resistance & rate limit test
├── test_deep_verification.js    # 11-point mathematical ledger and idempotency test
└── tsconfig.json                # TypeScript compiler configuration
```

---

## Getting Started

### 1. Prerequisites

- **Node.js**: `v22.13.0` or higher
- **npm**: `v10.x` or higher
- **MongoDB** *(Optional)*: `v6.0+` (If omitted, automatically uses persistent disk engine)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/khata-backend.git
cd khata-backend

# Install dependencies
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your secrets:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `4000` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `JWT_SECRET` | 32+ character random secret for JWT signing | *Required* |
| `MONGO_URI` | MongoDB connection connection URI | `mongodb://localhost:27017/khata` |
| `FIREBASE_PROJECT_ID` | Firebase Admin project ID | *Optional* |
| `FIREBASE_CLIENT_EMAIL`| Firebase service account client email | *Optional* |
| `FIREBASE_PRIVATE_KEY` | Firebase service account RSA private key | *Optional* |
| `CORS_ORIGIN` | Allowed CORS origins (`*` or specific domain) | `*` |

### 4. Running the Server

```bash
# Development mode (Hot-reload via ts-node-dev)
npm run dev

# Compile TypeScript to JavaScript
npm run build

# Start production server
npm start
```

---

## API Reference

### Health Check
- `GET /api/health` — Returns system health status, uptime, and active storage engine.

### Authentication (`/api/auth`)
- `POST /api/auth/device-session` — Generate dev session token for testing.
- `POST /api/auth/google` — Authenticate via Google ID token.
- `POST /api/auth/signup` — Register merchant account with email and password.
- `POST /api/auth/login` — Authenticate with email and password.
- `POST /api/auth/forgot-password` — Request password reset OTP.
- `POST /api/auth/reset-password` — Reset password using verified OTP.
- `GET /api/auth/me` — Retrieve current authenticated merchant profile.
- `PUT /api/auth/profile` — Update merchant profile and business details.

### Parties / Customers / Suppliers (`/api/parties`)
- `GET /api/parties` — List all customers and suppliers.
- `POST /api/parties` — Create a new customer or supplier.
- `GET /api/parties/:id` — Retrieve party details and balance.
- `PUT /api/parties/:id` — Update party information.
- `DELETE /api/parties/:id` — Delete a party.
- `POST /api/parties/sync` — Bulk offline synchronization with client UUID preservation.

### Transactions (`/api/transactions`)
- `GET /api/transactions` — List transactions (filterable by `partyId`).
- `POST /api/transactions` — Record new transaction with cryptographic hash chaining.
- `PUT /api/transactions/:id` — Update transaction amount or details.
- `DELETE /api/transactions/:id` — Delete transaction and recalculate party balance.
- `POST /api/transactions/sync` — Bulk sync offline transactions with replay idempotency.

### Cashbook (`/api/cashbook`)
- `GET /api/cashbook` — List cash entries (cash in / cash out).
- `POST /api/cashbook` — Create a new cashbook entry.
- `DELETE /api/cashbook/:id` — Delete cashbook entry.
- `POST /api/cashbook/sync` — Sync offline cashbook records.

### Reports & Analytics (`/api/reports`)
- `GET /api/reports/analytics` — Dashboard metrics: Net balance, You Will Get, You Will Give, Weekly Flow.
- `GET /api/reports/statement` — Account statement summary for reports export.

---

## Automated Verification & Tests

The backend includes a 3-tier automated test suite:

```bash
# Run the 11-point deep verification test
npm test

# Run the complete test suite (API, Security, Deep Verification)
npm run test:all
```

Test coverage includes:
1. **Health Check**: Engine status and uptime.
2. **Unauthorized Access**: HTTP 401 on missing tokens.
3. **Cryptographic Tamper Resistance**: HTTP 401 on modified token payload or signatures.
4. **Credential Hardening**: Verification that legacy backdoor credentials (`admin123`, `password123`) are permanently rejected.
5. **Session Provisioning**: Valid JWT creation and payload signature verification.
6. **Multi-tier Rate Limiter**: Verification of HTTP 429 response and `Retry-After` header enforcement.
7. **Client UUID Preservation**: Mobile offline party IDs retained without being overwritten by backend.
8. **Cryptographic Audit Hashing**: SHA-256 block hash generation and backward chaining.
9. **Retry Idempotency**: Verification that re-submitting an identical transaction returns HTTP 200 without double-counting balances.
10. **Cashbook Sync**: Offline cash entries processed and verified.
11. **Mathematical Analytics**: Exact ledger math verification (`youWillGet - youWillGive = netBalance`).

---

## GitHub Deployment & Setup

To push this repository to GitHub:

```bash
# 1. Initialize or verify remote repository
git remote add origin https://github.com/<your-username>/khata-backend.git

# 2. Rename branch to main if desired
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

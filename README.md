# Khata — Modern Digital Ledger & Bookkeeping Platform

[![Node Version](https://img.shields.io/badge/node-%3E%3D22.13.0-brightgreen.svg)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/react--native-0.88.1-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/expo-~58.0.25-black.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An enterprise-grade, offline-first digital ledger (Khata) platform designed for small and medium retail/wholesale businesses. Features a high-speed React Native mobile application with 26 screens and a hardened TypeScript backend with cryptographic SHA-256 audit hashing, zero-loss offline sync, and dual rate limiting.

---

## Architecture Overview

```
khata-app/
├── backend/                     # Node.js + Express + TypeScript REST API
│   ├── .github/workflows/ci.yml # Automated CI pipeline (Build, Lint, Deep Verification)
│   ├── src/                     # Auth, Parties, Transactions, Cashbook, Reports
│   ├── test_api.js              # Integration test suite
│   ├── test_security.js         # Security, JWT tamper resistance & rate limit tests
│   ├── test_deep_verification.js# 11-point mathematical ledger integrity suite
│   ├── .env.example             # Safe environment template
│   └── README.md                # Comprehensive backend documentation
│
├── mobile/                      # React Native + Expo 58 + SQLite Client
│   ├── .github/workflows/ci.yml # Automated CI pipeline (TypeScript check, Expo validation)
│   ├── src/app/                 # 26 file-based screens via Expo Router
│   ├── src/services/            # SQLite offline engine, Gemini AI, API sync
│   ├── src/store/               # Zustand auth & ledger state stores
│   ├── .env.example             # Safe mobile environment template
│   └── README.md                # Comprehensive mobile documentation
│
├── .gitignore                   # Root ignore rules (cloudflared, logs, extracted assets)
└── README.md                    # Master project documentation
```

---

## Core System Highlights

### 1. Mobile Client (`/mobile`)
- **26 Fully-Realized Responsive Screens**: Complete flows covering Customer/Supplier Ledgers, Daily Cashbook In/Out, Transaction Details, Statement Summaries, Profile & Business Settings.
- **Offline-First SQLite Storage**: Sub-16ms responsive UI with instant writes to local SQLite (`khata.db`) and robust pending sync queue.
- **Client UUID Preservation**: All records use client-generated UUIDs, ensuring zero data loss and exact idempotency when syncing with the backend.
- **Native Device Integrations**: Phone Contacts picker, Camera/Image attachments for bills, Biometric App Lock (`AppLockGate`), and fluid Sileo toast notifications.
- **AI Business Advisor**: Integrated Google Gemini API for real-time financial advice and cashflow optimization.

### 2. Backend Engine (`/backend`)
- **Cryptographic Ledger Integrity**: Every transaction generates a SHA-256 chained audit hash linked to the previous block, providing tamper-evident accounting.
- **Dual-Storage Resilience**: Hybrid storage supporting MongoDB with automatic fallback to persistent disk engine with exponential backoff file locking.
- **Security Hardening**: Dual-tier rate limiting (100 req/15min general API, 10 req/15min auth limiter) with RFC-compliant `Retry-After` headers and strict JWT signature verification.
- **Automated Verification**: Complete 3-tier test suite covering 100% of API endpoints, security bounds, and financial arithmetic.

---

## Quick Start (Local Development)

### 1. Start the Backend API

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run development server (Port 4000)
npm run dev
```

### 2. Run Verification Tests

```bash
cd backend

# Execute complete test suite
npm run test:all
```

### 3. Start the Mobile App

```bash
cd mobile

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env

# Start Expo development server
npm start
```

---

## GitHub Deployment & Repository Setup

The project is structured with independent git repositories for `backend` and `mobile`, allowing separate CI/CD pipelines, issue tracking, and deployment lifecycles.

### Option A: Push as Two Separate Repositories (Recommended)

#### 1. Push Backend (`khata-backend`)
```bash
cd D:\khata-app\backend

# Link to your GitHub repository
git remote add origin https://github.com/<your-username>/khata-backend.git

# Set main branch and push
git branch -M main
git push -u origin main
```

#### 2. Push Mobile (`khata-mobile`)
```bash
cd D:\khata-app\mobile

# Link to your GitHub repository
git remote add origin https://github.com/<your-username>/khata-mobile.git

# Set main branch and push
git branch -M main
git push -u origin main
```

---

### Option B: Push as a Unified Monorepo (`khata-app`)

If you prefer a single repository containing both sub-projects:

```bash
cd D:\khata-app

# 1. Initialize root git repository
git init

# 2. Stage root configuration and documentation
git add .gitignore README.md

# 3. Add mobile and backend (or configure as git submodules / subtrees)
# Note: Ensure child .git directories are archived or removed if committing as pure monorepo
git commit -m "chore: initial monorepo workspace for Khata"

# 4. Push to root GitHub repository
git remote add origin https://github.com/<your-username>/khata-app.git
git branch -M main
git push -u origin main
```

---

## Security & Secrets Compliance

- **No Secrets in Git**: All `.env` files are untracked and protected by `.gitignore`.
- **Environment Templates**: Comprehensive `.env.example` templates are provided in both `backend` and `mobile`.
- **No Node Modules in Git**: All `node_modules` folders and build outputs (`dist/`, `.expo/`, `android/build/`) are strictly ignored.
- **Automated CI**: GitHub Actions workflows in both repositories automatically test and typecheck every commit.

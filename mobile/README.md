# Khata Mobile App

[![CI Status](https://github.com/your-username/khata-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/khata-mobile/actions)
![React Native](https://img.shields.io/badge/react--native-0.88.1-blue.svg)
![Expo](https://img.shields.io/badge/expo-~58.0.25-black.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A mobile digital ledger (Khata) and business bookkeeping application for small and medium merchants. Built with **React Native (0.88.1)**, **Expo (v58)**, **Expo Router**, **TypeScript**, and **SQLite**, designed with an offline-first architecture, fluid animations, and real device hardware integrations.

---

## Key Features

- **26 Fully-Realized Mobile Screens**: Complete end-to-end flows for customer & supplier ledgers, cashbook in/out, transaction details, edit forms, PDF reports, profile management, and business settings.
- **Offline-First SQLite Engine**: Every transaction and ledger update writes instantly to local SQLite with zero lag. Operates 100% offline with background sync queueing.
- **Client UUID Preservation**: Part ids, transaction ids, and cashbook records are generated with client-side UUIDs to ensure zero duplication and complete idempotency during server sync.
- **Native Device Hardware Integrations**:
  - **Phone Contacts**: Seamless contact picker to onboard parties without typing.
  - **Camera & Image Picker**: Attach bill photos, receipts, and invoices directly to transactions.
  - **Biometrics & App Lock**: Face ID / Fingerprint / PIN authentication lock gate (`AppLockGate`).
  - **Sileo Toast Notifications**: Custom fluid slide-down toast system for real-time feedback.
- **AI Financial Assistant**: In-app conversational business advisor powered by Google Gemini API for cashflow insights, recovery tips, and ledger queries.
- **Dynamic Reports & PDF Sharing**: Instant account statements, party ledger summaries, and date-filtered exports via `expo-print` and `expo-sharing`.
- **UPI QR Code Generation**: Instant QR code generation for digital debt collection.

---

## Directory Structure

```
mobile/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI pipeline
├── android/                     # Prebuilt Android native project
│   ├── app/
│   │   ├── src/main/            # Native Android manifest and assets
│   │   └── build.gradle
│   └── build.gradle
├── assets/                      # App launcher icons, splash screen assets
├── src/
│   ├── app/                     # Expo Router file-based screen routes (26 screens)
│   │   ├── (tabs)/              # Bottom tab bar screens (Home, Reports, Settings)
│   │   ├── add-customer.tsx     # Add customer with contact picker & credit limits
│   │   ├── ai-assistant.tsx     # AI Financial Business Advisor screen
│   │   ├── app-lock-settings.tsx# Biometric and PIN security configuration
│   │   ├── cashbook.tsx         # Daily cash in/out register
│   │   ├── party/[id].tsx       # Deep customer/supplier ledger screen
│   │   ├── transaction-details.tsx # Detailed receipt & audit hash view
│   │   ├── signup.tsx           # Merchant registration screen
│   │   ├── login.tsx            # Merchant authentication
│   │   └── ...                  # Bills, items, permissions, payment settings
│   ├── components/
│   │   ├── common/              # AppLockGate, CustomTabBar, ScalePressable, SileoNotification
│   │   └── modals/              # AddTransactionModal, FilterSortModal, QrCodeModal
│   ├── services/
│   │   ├── aiService.ts         # Google Gemini API connector
│   │   ├── apiService.ts        # Backend REST API connector with LAN/tunnel support
│   │   ├── permissionService.ts # Android/iOS runtime permissions manager
│   │   └── sqliteService.ts     # Offline SQLite schema, migrations & CRUD operations
│   ├── store/
│   │   ├── useAuthStore.ts      # Merchant auth state and JWT storage
│   │   └── useKhataStore.ts     # Ledger state, parties, transactions & sync queue
│   └── theme/
│       └── theme.ts             # Professional color palette, typography & layout tokens
├── .env.example                 # Environment configuration template
├── .gitignore                   # Hardened git ignore definitions
├── app.json                     # Expo application configuration
├── package.json                 # Project dependencies and npm scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## Getting Started

### 1. Prerequisites

- **Node.js**: `v22.13.0` or higher
- **npm**: `v10.x` or higher
- **Expo CLI**: Installed via `npm install -g expo-cli` (or run with `npx expo`)
- **Android Studio** *(for Android builds)*: Android SDK 35+ and Android Emulator or physical device

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/khata-mobile.git
cd khata-mobile

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Base URL of backend server | `http://10.0.2.2:4000` (Android emulator) or `https://xyz.trycloudflare.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier | `khata-app-prod-2026` |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google AI Studio API key | *(Optional, for AI Assistant)* |

### 4. Running the App

```bash
# Start the Expo development server
npm start

# Run on Android device / emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios
```

---

## Offline Synchronization Engine

The mobile application utilizes a write-ahead SQLite offline storage architecture:

1. **Instant UI Response**: Any transaction recorded by the merchant is immediately saved to local SQLite (`khata.db`) and reflected in the UI within `< 16ms`.
2. **Sync Queue**: If network is unavailable or the backend is offline, operations are enqueued in SQLite's pending sync table.
3. **Idempotent Dispatch**: When connectivity is restored, items are batched and dispatched using their original UUIDs. The backend verifies whether each UUID has already been recorded, preventing duplicate transactions.
4. **Conflict Resolution**: The local balance is updated using authoritative server timestamps without overriding uncommitted local changes.

---

## Static Typecheck & Verification

Run the TypeScript type checker to ensure type safety across all 26 screens:

```bash
npm run typecheck
```

---

## Building Production APK

To build a standalone Android APK:

```bash
# Using native Gradle wrapper
cd android
./gradlew assembleRelease

# Or using EAS Build
npx eas build --platform android --profile production
```
The output APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

---

## GitHub Deployment & Setup

To push this repository to GitHub:

```bash
# 1. Initialize or verify remote repository
git remote add origin https://github.com/<your-username>/khata-mobile.git

# 2. Rename branch to main if desired
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

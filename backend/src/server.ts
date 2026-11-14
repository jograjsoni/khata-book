/**
 * Production Khata Express Server.
 * Supports offline-first mobile sync, multi-tenant JWT auth, MongoDB / Persistent dual-store,
 * rate limiting, cryptographic SHA-256 ledger integrity, and financial analytics.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes';
import partyRoutes from './routes/party.routes';
import transactionRoutes from './routes/transaction.routes';
import cashbookRoutes from './routes/cashbook.routes';
import reportRoutes from './routes/report.routes';
import { storage } from './services/storageService';
import { apiRateLimiter } from './middleware/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

/* ─── Production Security & Performance Middleware ─── */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(morgan('short'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting
app.use('/api', apiRateLimiter);

/* ─── Route Registration ─── */
app.use('/api/auth', authRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/reports', reportRoutes);

/* ─── Health & Diagnostics Route ─── */
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'persistent-disk-engine',
    timestamp: new Date().toISOString(),
    security: {
      jwt: 'enabled',
      rateLimiter: 'enabled',
      sha256AuditChaining: 'enabled',
      unifiedGoogleEmailIdentity: 'enabled',
      firebaseAuthLinkage: 'enabled',
    },
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

/* ─── Process Stability & Error Handling ─── */
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[server] Unhandled Rejection at:', promise, 'reason:', reason);
});

/* ─── Start Server & Database Initialization ─── */
async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/khata';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[mongo] Connected successfully to ${mongoUri}`);
    storage.setMongoConnected(true);
  } catch (err: any) {
    console.log(`[storage] MongoDB offline/not detected. Running with high-speed persistent disk ledger engine.`);
    storage.setMongoConnected(false);
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Khata API live on port ${PORT}`);
  });

  return server;
}

if (require.main === module) {
  start();
}

export default app;

import { Router, Response } from 'express';
import { storage } from '../services/storageService';
import {
  authenticateToken,
  apiReadRateLimiter,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/reports/analytics
 * Computes exact mathematical aggregates for financial dashboard & reports.
 * Protected by read rate limiter.
 */
router.get('/analytics', apiReadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const parties = await storage.getPartiesByUser(userId);
    const transactions = await storage.getTransactionsByUser(userId);

    const customers = parties.filter((p) => p.type === 'customer');
    const suppliers = parties.filter((p) => p.type === 'supplier');

    // Total You Will Get: Sum of positive balances owed by customers
    const youWillGet = parties
      .filter((p) => p.balanceType === 'get')
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);

    // Total You Will Give: Sum of balances merchant owes to suppliers
    const youWillGive = parties
      .filter((p) => p.balanceType === 'give')
      .reduce((sum, p) => sum + Math.abs(p.balance), 0);

    const netBalance = youWillGet - youWillGive;

    // Recent transaction status counts
    const paidCount = transactions.filter((t) => t.type === 'got').length;
    const pendingCount = transactions.filter((t) => t.type === 'gave').length;

    // Weekly flow analytics calculated dynamically from real transactions and cashbook
    const cashbook = await storage.getCashbookByUser(userId);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyFlow = dayNames.map((day) => ({ day, inAmount: 0, outAmount: 0 }));

    for (const c of cashbook) {
      try {
        const d = new Date(c.createdAt || Date.now());
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0
        const dayName = dayNames[dayIdx];
        const item = weeklyFlow.find((w) => w.day === dayName);
        if (item) {
          if (c.type === 'in') item.inAmount += c.amount;
          else item.outAmount += c.amount;
        }
      } catch {}
    }

    for (const t of transactions) {
      try {
        const d = new Date(t.createdAt || Date.now());
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0
        const dayName = dayNames[dayIdx];
        const item = weeklyFlow.find((w) => w.day === dayName);
        if (item) {
          if (t.type === 'got') item.inAmount += t.amount;
          else item.outAmount += t.amount;
        }
      } catch {}
    }

    return res.json({
      success: true,
      data: {
        netBalance,
        youWillGet,
        youWillGive,
        customersCount: customers.length,
        suppliersCount: suppliers.length,
        paidCount,
        pendingCount,
        totalTransactions: transactions.length,
        weeklyFlow,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to compute financial analytics.' });
  }
});

export default router;

import { Router, Response } from 'express';
import { storage } from '../services/storageService';
import {
  authenticateToken,
  apiReadRateLimiter,
  apiMutationRateLimiter,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/cashbook
 * Retrieve all cash in/out entries and compute exact mathematical totals.
 */
router.get('/', apiReadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const entries = await storage.getCashbookByUser(userId);

    const totalIn = entries
      .filter((e) => e.type === 'in')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOut = entries
      .filter((e) => e.type === 'out')
      .reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      success: true,
      summary: {
        totalIn,
        totalOut,
        netCash: totalIn - totalOut,
      },
      data: entries,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve cashbook entries.' });
  }
});

/**
 * POST /api/cashbook
 * Record Cash In or Cash Out entry with validation.
 */
router.post('/', apiMutationRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const { title, subtitle = '', amount, type, mode = 'Cash' } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Entry title is required.',
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: 'Numeric amount is required.',
      });
    }

    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number greater than zero.',
      });
    }

    if (type !== 'in' && type !== 'out') {
      return res.status(400).json({
        success: false,
        error: 'Entry type must be either "in" or "out".',
      });
    }

    const now = new Date();

    const validMode: 'Cash' | 'UPI Transfer' | 'Bank Transfer' =
      mode === 'UPI Transfer' || mode === 'Bank Transfer' ? mode : 'Cash';

    const rawCbId = req.body.id;
    const entryId =
      typeof rawCbId === 'string' && rawCbId.trim().length > 0
        ? rawCbId.trim()
        : `cb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const entry = await storage.addCashbookEntry({
      id: entryId,
      userId,
      title: title.trim(),
      subtitle: typeof subtitle === 'string' ? subtitle.trim() : '',
      amount: numAmount,
      type,
      date: 'Today',
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      mode: validMode,
      status: 'Verified',
    });

    return res.status(201).json({
      success: true,
      message: 'Cashbook entry saved successfully.',
      data: entry,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to record cashbook entry.' });
  }
});

export default router;

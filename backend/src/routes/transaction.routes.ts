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
 * GET /api/transactions
 * Retrieve transactions for current authenticated merchant.
 * Optionally filter by ?partyId=...
 */
router.get('/', apiReadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const { partyId } = req.query;

    const list = await storage.getTransactionsByUser(
      userId,
      typeof partyId === 'string' ? partyId : undefined
    );

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve transactions.' });
  }
});

/**
 * POST /api/transactions
 * Record a new Gave (उधार दिया) or Got (भुगतान लिया) transaction.
 * Automatically recalculates party net balance and generates SHA-256 cryptographic audit hash.
 */
router.post('/', apiMutationRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const { partyId, amount, type, note, mode = 'Cash', billPhoto, date } = req.body;

    if (!partyId || typeof partyId !== 'string' || !partyId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A valid partyId is required.',
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: 'Transaction amount is required.',
      });
    }

    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number greater than zero.',
      });
    }

    if (type !== 'gave' && type !== 'got') {
      return res.status(400).json({
        success: false,
        error: 'Transaction type must be either "gave" or "got".',
      });
    }

    const txDate =
      typeof date === 'string' && date.trim().length > 0
        ? date.trim()
        : new Date().toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

    const rawTxId = req.body.id;
    const txId =
      typeof rawTxId === 'string' && rawTxId.trim().length > 0
        ? rawTxId.trim()
        : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const validMode: 'Cash' | 'UPI Transfer' | 'Bank Transfer' =
      mode === 'UPI Transfer' || mode === 'Bank Transfer' ? mode : 'Cash';

    const result = await storage.addTransaction({
      id: txId,
      userId,
      partyId: partyId.trim(),
      amount: numAmount,
      type,
      date: txDate,
      note: typeof note === 'string' ? note.trim() : '',
      mode: validMode,
      verified: true,
      billPhoto: typeof billPhoto === 'string' ? billPhoto : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully with cryptographic audit hash.',
      data: result.transaction,
      updatedParty: result.updatedParty,
    });
  } catch (err: any) {
    console.error('[transactions] Create error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to record transaction.',
    });
  }
});

export default router;

import { Router, Response } from 'express';
import { storage, PartyRecord } from '../services/storageService';
import {
  authenticateToken,
  apiReadRateLimiter,
  apiMutationRateLimiter,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/parties
 * Get all parties (customers/suppliers) isolated for current authenticated merchant.
 */
router.get('/', apiReadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const { type, search } = req.query;

    const list = await storage.getPartiesByUser(
      userId,
      typeof type === 'string' ? type : undefined,
      typeof search === 'string' ? search : undefined
    );

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve parties.' });
  }
});

/**
 * GET /api/parties/:id
 * Retrieve party details and its specific ledger entry history.
 */
router.get('/:id', apiReadRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const rawId = req.params.id;
    const partyId = Array.isArray(rawId) ? rawId[0] : rawId;
    const party = await storage.getPartyById(userId, partyId);

    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found.' });
    }

    const entries = await storage.getTransactionsByUser(userId, party.id);

    return res.json({
      success: true,
      data: party,
      entries,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve party details.' });
  }
});

/**
 * POST /api/parties
 * Add new customer or supplier with input validation.
 */
router.post('/', apiMutationRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const { name, phone, type = 'customer', address, gstin, pan, aadhaar, creditLimit, riskLevel } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Valid party name is required.' });
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
    }

    const rawId = req.body.id;
    const partyId =
      typeof rawId === 'string' && rawId.trim().length > 0
        ? rawId.trim()
        : `party-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Idempotent creation: if already exists for this merchant, return existing
    const existing = await storage.getPartyById(userId, partyId);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Party already exists.',
        data: existing,
      });
    }

    const newParty: PartyRecord = {
      id: partyId,
      userId,
      name: name.trim(),
      phone: phone.trim(),
      type: type === 'supplier' ? 'supplier' : 'customer',
      balance: 0,
      balanceType: 'settled',
      lastTxDate: 'Just added',
      status: 'No Due Date',
      address: typeof address === 'string' ? address.trim() : '',
      gstin: typeof gstin === 'string' ? gstin.trim() : '',
      pan: typeof pan === 'string' ? pan.trim() : '',
      aadhaar: typeof aadhaar === 'string' ? aadhaar.trim() : '',
      creditLimit: creditLimit !== undefined && !isNaN(Number(creditLimit)) ? Number(creditLimit) : undefined,
      riskLevel: riskLevel === 'High' || riskLevel === 'Medium' ? riskLevel : 'Low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await storage.saveParty(newParty);

    return res.status(201).json({
      success: true,
      message: `${type === 'supplier' ? 'Supplier' : 'Customer'} added successfully.`,
      data: saved,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to create party.' });
  }
});

/**
 * PUT /api/parties/:id
 * Update party details (contact, PAN, credit limit, etc.).
 */
router.put('/:id', apiMutationRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const rawId = req.params.id;
    const partyId = Array.isArray(rawId) ? rawId[0] : rawId;
    const party = await storage.getPartyById(userId, partyId);

    if (!party) {
      return res.status(404).json({ success: false, error: 'Party not found.' });
    }

    const updates = req.body;
    const updated: PartyRecord = {
      ...party,
      ...updates,
      id: party.id,
      userId: party.userId,
      balance: party.balance, // Balance strictly preserved; only altered via financial transactions
      balanceType: party.balanceType,
    };

    const saved = await storage.saveParty(updated);

    return res.json({
      success: true,
      message: 'Party updated successfully.',
      data: saved,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update party.' });
  }
});

/**
 * DELETE /api/parties/:id
 * Remove party and its ledger history cleanly.
 */
router.delete('/:id', apiMutationRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user identity.' });
    }

    const rawId = req.params.id;
    const partyId = Array.isArray(rawId) ? rawId[0] : rawId;
    const deleted = await storage.deleteParty(userId, partyId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Party not found.' });
    }

    return res.json({
      success: true,
      message: 'Party and associated transactions removed successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete party.' });
  }
});

export default router;

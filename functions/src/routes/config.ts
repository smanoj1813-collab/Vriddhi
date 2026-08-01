// functions/src/routes/config.ts
import * as express from 'express';
import { db } from '../config/firebase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/config/batch-branch
router.get('/batch-branch', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = req.user!.collegeId;
    if (!collegeId) {
      res.status(400).json({ error: 'No college associated with user' });
      return;
    }

    const configDoc = await db.collection('college_configs').doc(collegeId).get();
    const config = configDoc.data();

    res.json({
      success: true,
      batches: config?.batches || ['2024', '2025', '2026', '2027'],
      branches: config?.branches || ['B.Com', 'BBA', 'BCA'],
    });
  } catch (err: any) {
    console.error('Batch-branch config error:', err);
    res.status(500).json({ error: err.message });
  }
});

export { router };
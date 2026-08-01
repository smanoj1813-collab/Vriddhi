// ─────────────────────────────────────────────
// FILE: function s/src/middleware/tierCheck.ts
// ─────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { TIER_CONFIG, TierType } from '../config/aiProviders';

export interface TieredRequest extends Request {
  userTier?: TierType;
  userPlan?: any;
}

// ─── Attach user's tier & plan to request ───
export const checkTier = async (
  req: TieredRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get user's subscription from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Default to basic if no plan found
    const tier: TierType = userData?.subscription?.tier || 'basic';
    const plan = TIER_CONFIG[tier];
    
    req.userTier = tier;
    req.userPlan = plan;

    next();
  } catch (err) {
    console.error('Tier check error:', err);
    // Default to basic on error
    req.userTier = 'basic';
    req.userPlan = TIER_CONFIG.basic;
    next();
  }
};

// ─── Enforce daily question generation limit ───
export const enforceQuestionLimit = async (
  req: TieredRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.uid;
    const tier = req.userTier || 'basic';
    const limit = TIER_CONFIG[tier].dailyQuestionLimit;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get today's date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const usageDocRef = db
      .collection('ai_usage')
      .doc(userId)
      .collection('daily')
      .doc(today);

    const usageDoc = await usageDocRef.get();
    const usageData = usageDoc.data();
    const questionsGeneratedToday = usageData?.questionCount || 0;

    if (questionsGeneratedToday >= limit) {
      res.status(429).json({
        error: 'Daily question limit exceeded',
        tier,
        limit,
        used: questionsGeneratedToday,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      return;
    }

    // Attach usage info for the route handler to increment
    (req as any).aiUsage = {
      docRef: usageDocRef,
      currentCount: questionsGeneratedToday,
    };

    next();
  } catch (err) {
    console.error('Question limit check error:', err);
    // Allow through on error (fail open) — or change to fail closed
    next();
  }
};

// ─── Enforce feature access by tier ───
export const requireFeature = (feature: keyof typeof TIER_CONFIG.basic.features) => {
  return (req: TieredRequest, res: Response, next: NextFunction): void => {
    const tier = req.userTier || 'basic';
    const hasFeature = TIER_CONFIG[tier].features[feature];

    if (!hasFeature) {
      res.status(403).json({
        error: 'Feature not available on your plan',
        feature,
        requiredTier: Object.keys(TIER_CONFIG).find(
          (t) => TIER_CONFIG[t as TierType].features[feature]
        ),
        yourTier: tier,
      });
      return;
    }

    next();
  };
};

// ─── Enforce provider access by tier ───
export const requireProvider = (provider: string) => {
  return (req: TieredRequest, res: Response, next: NextFunction): void => {
    const tier = req.userTier || 'basic';
    const allowedProviders = TIER_CONFIG[tier].providers;

    if (!allowedProviders.includes(provider as any)) {
      res.status(403).json({
        error: 'Provider not available on your plan',
        provider,
        allowedProviders,
        yourTier: tier,
      });
      return;
    }

    next();
  };
};

// ─── Increment usage count after successful generation ───
export const incrementUsage = async (userId: string, count: number = 1): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  const usageDocRef = db
    .collection('ai_usage')
    .doc(userId)
    .collection('daily')
    .doc(today);

  await usageDocRef.set(
    {
      questionCount: FieldValue.increment(count),
      lastUsedAt: FieldValue.serverTimestamp(),
      date: today,
    },
    { merge: true }
  );
};

// Import FieldValue at top
import { FieldValue } from 'firebase-admin/firestore';
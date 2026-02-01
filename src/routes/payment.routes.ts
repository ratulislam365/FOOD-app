import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limiting for financial data
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests to payment services. Please try again later.'
    }
});

/**
 * All routes are prefixed with /api/v1/provider/payments
 */

router.use(authenticate as any);
router.use(requireRole(['PROVIDER']) as any);
router.use(paymentLimiter);

router.get('/overview', paymentController.getOverview);
router.get('/history', paymentController.getHistory);
router.get('/search', paymentController.search);

export default router;

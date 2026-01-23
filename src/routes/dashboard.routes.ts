import express from 'express';
import rateLimit from 'express-rate-limit';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = express.Router();

// Rate limiting for dashboard APIs
const dashboardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests to dashboard, please try again later',
    },
});

// All dashboard routes require authentication and PROVIDER role
router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(dashboardLimiter);

router.get('/', dashboardController.getUnifiedDashboard);
router.get('/overview', dashboardController.getOverview);
router.get('/revenue-analytics', dashboardController.getRevenueAnalytics);
router.get('/popular-dishes', dashboardController.getPopularDishes);
router.get('/recent-orders', dashboardController.getRecentOrders);

export default router;

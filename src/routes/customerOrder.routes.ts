import express from 'express';
import rateLimit from 'express-rate-limit';
import customerOrderController from '../controllers/customerOrder.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = express.Router();

// Rate limiting for order listing APIs
const orderListLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later'
    }
});

router.use(authenticate);
router.use(requireRole(['CUSTOMER']));
router.use(orderListLimiter);

// GET /api/v1/customer/orders/current
router.get('/current', customerOrderController.getCurrentOrders);

// GET /api/v1/customer/orders/previous
router.get('/previous', customerOrderController.getPreviousOrders);

export default router;

import express from 'express';
import rateLimit from 'express-rate-limit';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = express.Router();

// Rate limiting for order management APIs
const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many order requests, please try again later',
    },
});

// All provider order routes require authentication and PROVIDER role
router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(orderLimiter);

router.get('/', orderController.getAllOrders);
router.get('/pending', orderController.getPendingOrders);
router.get('/preparing', orderController.getPreparingOrders);
router.get('/ready', orderController.getReadyOrders);
router.get('/completed', orderController.getCompletedOrders);
router.get('/cancelled', orderController.getCancelledOrders);

export default router;

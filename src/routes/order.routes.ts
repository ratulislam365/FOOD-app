import express from 'express';
import rateLimit from 'express-rate-limit';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { getOrdersQuerySchema } from '../validations/order.validation';

const router = express.Router();


const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many order requests, please try again later',
    },
});


router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(orderLimiter);

router.get('/', validate(getOrdersQuerySchema), orderController.getAllOrders);
router.get('/pending', orderController.getPendingOrders);
router.get('/preparing', orderController.getPreparingOrders);
router.get('/ready', orderController.getReadyOrders);
router.get('/completed', orderController.getCompletedOrders);
router.get('/cancelled', orderController.getCancelledOrders);

export default router;

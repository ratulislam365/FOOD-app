import express from 'express';
import rateLimit from 'express-rate-limit';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { getOrdersQuerySchema, createOrderSchema } from '../validations/order.validation';

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
router.use(orderLimiter);

// Customer Routes
router.post('/', requireRole(['CUSTOMER']), validate(createOrderSchema), orderController.createOrder);

// Shared Routes (Accessible by both Customer and Provider)
// Cancel can be initiated by CUSTOMER or PROVIDER
router.patch('/:orderId/cancel', requireRole(['CUSTOMER', 'PROVIDER']), orderController.cancelOrder);

// Get All My Orders (Customer or Provider list)
router.get('/all', requireRole(['CUSTOMER', 'PROVIDER']), validate(getOrdersQuerySchema), orderController.getUserOrders);

// Get Single Order Details
router.get('/:orderId', requireRole(['CUSTOMER', 'PROVIDER']), orderController.getOrderDetails);

// Provider Only Routes
router.use(requireRole(['PROVIDER']));

router.get('/', validate(getOrdersQuerySchema), orderController.getAllOrders);
router.get('/pending', orderController.getPendingOrders);
router.get('/preparing', orderController.getPreparingOrders);
router.get('/ready', orderController.getReadyOrders);
router.get('/pickup', orderController.getPickedUpOrders);
router.get('/completed', orderController.getCompletedOrders);
router.get('/cancelled', orderController.getCancelledOrders);

// Status Transitions
router.patch('/:orderId/accept', orderController.acceptOrder);
router.patch('/:orderId/ready', orderController.markReady);
router.patch('/:orderId/pickup', orderController.markPickedUp);
router.patch('/:orderId/complete', orderController.markCompleted);

export default router;

import express from 'express';
import rateLimit from 'express-rate-limit';
import providerController from '../controllers/provider.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';

const router = express.Router();

const providerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later',
    },
});

router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(providerLimiter);

router.get('/customers/:customerId/details', providerController.getCustomerDetails);

export default router;

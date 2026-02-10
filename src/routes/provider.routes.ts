import express from 'express';
import rateLimit from 'express-rate-limit';
import providerController from '../controllers/provider.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import providerProfileController from '../controllers/providerProfile.controller';
import { updateProfileSchema } from '../validations/providerProfile.validation';

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

router.get('/orders', providerController.getOrders);
router.get('/orders/ready', providerController.getReadyOrders);
router.get('/customers/:customerId/details', providerController.getCustomerDetails);
router.get(['/profile', '/profile/me'], providerProfileController.getProfile);
router.patch(['/profile', '/profile/me'], validate(updateProfileSchema), providerProfileController.updateProfile);
router.put(['/profile', '/profile/me'], validate(updateProfileSchema), providerProfileController.updateProfile);
router.delete(['/profile', '/profile/me'], providerProfileController.deleteProfile);

export default router;

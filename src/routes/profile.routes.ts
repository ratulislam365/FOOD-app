import express from 'express';
import rateLimit from 'express-rate-limit';
import profileController from '../controllers/profile.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { createProfileSchema, updateProfileSchema } from '../validations/profile.validation';

const router = express.Router();


const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many profile requests, please try again later',
    },
});

router.use(authenticate);
router.use(requireRole(['CUSTOMER']));
router.use(profileLimiter);

router
    .route('/')
    .post(validate(createProfileSchema), profileController.createProfile)
    .get(profileController.getProfile)
    .put(validate(updateProfileSchema), profileController.updateProfile)
    .delete(profileController.deleteProfile);

export default router;

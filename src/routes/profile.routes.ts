import express from 'express';
import rateLimit from 'express-rate-limit';
import profileController from '../controllers/profile.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validations/profile.validation';

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
router.use(profileLimiter);

// @desc    Get current user profile
// @route   GET /api/v1/profile/me (or GET /api/v1/profile)
router.get(['/', '/me'], profileController.getProfile);

// @desc    Update current user profile
// @route   PATCH/PUT /api/v1/profile/me (or /api/v1/profile)
router.patch(['/', '/me'], validate(updateProfileSchema), profileController.updateProfile);
router.put(['/', '/me'], validate(updateProfileSchema), profileController.updateProfile);

// @desc    Delete current user profile (Soft Delete)
// @route   DELETE /api/v1/profile/me (or DELETE /api/v1/profile)
router.delete(['/', '/me'], profileController.deleteProfile);

export default router;

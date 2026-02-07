import express from 'express';
import rateLimit from 'express-rate-limit';
import bannerController from '../controllers/banner.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import {
    createBannerSchema,
    updateBannerSchema,
    getBannersQuerySchema
} from '../validations/banner.validation';

const router = express.Router();

const bannerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for development (change to 10 in production)
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

router.use(bannerLimiter);

// 1. PUBLIC / AUTHENTICATED - View Active Banners
// Accessible by anyone (public) or specific roles if needed. 
// Requirement says CUSTOMER and PROVIDER can view.
router.get('/active', bannerController.getActiveBanners);

// 2. ADMIN ONLY ROUTES
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.post('/', validate(createBannerSchema), bannerController.createBanner);
router.patch('/:id', validate(updateBannerSchema), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.get('/', validate(getBannersQuerySchema), bannerController.listAllBanners);

export default router;

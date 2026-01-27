import express from 'express';
import rateLimit from 'express-rate-limit';
import feedController from '../controllers/feed.controller';
import { validate } from '../middlewares/validate';
import { getFeedSchema } from '../validations/feed.validation';

const router = express.Router();

// General rate limiter for public feed access
const feedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many feed requests, please try again later',
    },
});

router.use(feedLimiter);

/**
 * GET /feed
 * Publicly accessible food feed with social-style prioritization
 */
router.get('/', validate(getFeedSchema), feedController.getFeed);

export default router;

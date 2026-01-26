import express from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { createReviewSchema, replyReviewSchema, getReviewsQuerySchema, updateReviewSchema } from '../validations/review.validation';

const router = express.Router();

// Public: View reviews for a specific provider (with optional filters)
router.get('/provider/:providerId', validate(getReviewsQuerySchema), reviewController.getProviderReviews);

// Public: Get rating distribution stats
router.get('/stats/:providerId', reviewController.getRatingStats);

// Protected Routes
router.use(authenticate);

// Get Specific Review
router.get('/:reviewId', reviewController.getReviewById);

// Customer: Submit/Update/Delete review
router.post('/', requireRole(['CUSTOMER']), validate(createReviewSchema), reviewController.createReview);
router.patch('/:reviewId', requireRole(['CUSTOMER']), validate(updateReviewSchema), reviewController.updateReview);
router.delete('/:reviewId', requireRole(['CUSTOMER', 'ADMIN']), reviewController.deleteReview);

// Provider: Reply to a review
router.post('/:reviewId/reply', requireRole(['PROVIDER']), validate(replyReviewSchema), reviewController.replyToReview);

export default router;

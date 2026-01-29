import express from 'express';
import rateLimit from 'express-rate-limit';
import favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import { createFavoriteSchema, removeFavoriteSchema, getFeedSchema } from '../validations/favorite.validation';

const router = express.Router();

// Rate limiting for favorite actions
const favoriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many favorite requests, please try again later',
    },
});

router.use(authenticate);
router.use(favoriteLimiter);

// Customer Routes
router.post('/', requireRole(['CUSTOMER']), validate(createFavoriteSchema), favoriteController.addFavorite);
router.get('/feed', requireRole(['CUSTOMER']), validate(getFeedSchema), favoriteController.getFavoriteFeed);
router.delete('/:foodId', requireRole(['CUSTOMER']), validate(removeFavoriteSchema), favoriteController.removeFavorite);

// Stats (Accessible by Provider as per requirements "Providers can...")
// But also general info. Placing it here or in food routes. 
// "GET /foods/:id/stats" -> The User requested this URL structure.
// So I will likely need to mount another router or handle it in `food.routes.ts`.
// BUT, I'll export a separate handler or router for that if needed.
// For now, I'll add a route here to cover it if the user decides to use /favorites/stats/:foodId or similar as fallback,
// but I will primarily add it to `food.routes.ts` as requested.

export default router;

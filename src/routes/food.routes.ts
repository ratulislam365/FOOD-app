import express from 'express';
import rateLimit from 'express-rate-limit';
import foodController from '../controllers/food.controller';
import favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import {
    createFoodSchema,
    updateFoodSchema,
    foodIdSchema,
    foodByCategorySchema,
    getFoodsQuerySchema,
} from '../validations/food.validation';

const router = express.Router();


const foodOpsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many food management operations, please try again after 15 minutes',
    },
});


router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(foodOpsLimiter);

router
    .route('/')
    .post(validate(createFoodSchema), foodController.createFood)
    .get(validate(getFoodsQuerySchema), foodController.getOwnFoods);

router.get(
    '/category/:categoryId',
    validate(foodByCategorySchema),
    foodController.getFoodsByCategory
);

router
    .route('/:id')
    .get(validate(foodIdSchema), foodController.getFoodById)
    .patch(validate(updateFoodSchema), foodController.updateFood)
    .delete(validate(foodIdSchema), foodController.deleteFood);

router.get('/:foodId/stats', requireRole(['PROVIDER']), favoriteController.getFoodStats);

export default router;

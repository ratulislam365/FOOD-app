import express from 'express';
import rateLimit from 'express-rate-limit';
import foodController from '../controllers/food.controller';
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

// Specific rate limit for food upload operations
const foodOpsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many food management operations, please try again after 15 minutes',
    },
});

// All food routes require authentication and PROVIDER role
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

export default router;

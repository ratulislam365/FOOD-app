import express from 'express';
import rateLimit from 'express-rate-limit';
import categoryController from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { validate } from '../middlewares/validate';
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
} from '../validations/category.validation';
import cloudinaryConfig from '../config/cloudinary';

const router = express.Router();

// Rate limiting for provider management
const providerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_ERROR',
        message: 'Too many category operations, please try again after an hour',
    },
});

// All category routes require authentication and PROVIDER role
router.use(authenticate);
router.use(requireRole(['PROVIDER']));
router.use(providerLimiter);

router
    .route('/')
    .post(cloudinaryConfig.upload.single('image'), validate(createCategorySchema), categoryController.createCategory)
    .get(categoryController.getOwnCategories);

router
    .route('/:id')
    .get(validate(categoryIdSchema), categoryController.getCategoryById)
    .patch(validate(updateCategorySchema), categoryController.updateCategory)
    .delete(validate(categoryIdSchema), categoryController.deleteCategory);

export default router;

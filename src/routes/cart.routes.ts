import { Router } from 'express';
import cartController from '../controllers/cart.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema,
} from '../validations/cart.validation';
import rateLimit from 'express-rate-limit';

const router = Router();

const cartLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200,
    message: {
        success: false,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many cart requests, please try again later',
    },
});

// All cart routes require authentication
router.use(authenticate as any);
router.use(cartLimiter);

/**
 * @route   GET /api/v1/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   GET /api/v1/cart/count
 * @desc    Get cart item count (for UI badge)
 * @access  Private
 */
router.get('/count', cartController.getCartCount);

/**
 * @route   POST /api/v1/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add', validate(addToCartSchema), cartController.addToCart);

/**
 * @route   PATCH /api/v1/cart/update
 * @desc    Update item quantity
 * @access  Private
 */
router.patch('/update', validate(updateCartItemSchema), cartController.updateCartItem);

/**
 * @route   DELETE /api/v1/cart/remove
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove', validate(removeFromCartSchema), cartController.removeFromCart);

/**
 * @route   DELETE /api/v1/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear', cartController.clearCart);

export default router;

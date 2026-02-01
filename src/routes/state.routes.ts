import { Router } from 'express';
import stateController from '../controllers/state.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const stateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
});

router.use(stateLimiter);

/**
 * @route   GET /api/v1/states
 * @desc    Get all active USA states
 * @access  Public
 */
router.get('/', stateController.getAllStates);

/**
 * @route   GET /api/v1/states/search
 * @desc    Search states by name
 * @access  Public
 */
router.get('/search', stateController.searchStates);

export default router;

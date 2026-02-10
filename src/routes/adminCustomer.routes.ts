import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import adminCustomerController from '../controllers/adminCustomer.controller';
import { UserRole } from '../models/user.model';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(requireRole([UserRole.ADMIN]));

/**
 * GET /admin/customers/dashboard/:providerId
 * 
 * Get customer activity dashboard filtered by provider
 */
router.get('/dashboard/:providerId', adminCustomerController.getProviderCustomerDashboard);

export default router;

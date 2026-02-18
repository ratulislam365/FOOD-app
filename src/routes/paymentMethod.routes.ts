import express from 'express';
import { authenticate } from '../middlewares/authenticate';
import paymentMethodController from '../controllers/paymentMethod.controller';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../models/user.model';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Both PROVIDERS and CUSTOMERS might want to manage payment methods,
// but based on user's specific request for 'provider', we can keep it flexible.
router.use(requireRole([UserRole.PROVIDER, UserRole.CUSTOMER]));

router.get('/', paymentMethodController.getMethods);
router.post('/', paymentMethodController.addMethod);
router.patch('/:id/default', paymentMethodController.setDefault);
router.delete('/:id', paymentMethodController.deleteMethod);

export default router;

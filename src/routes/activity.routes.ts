import express from 'express';
import activityLogController from '../controllers/activityLog.controller';
import { authenticate } from '../middlewares/authenticate';

const router = express.Router();

// All activity routes require authentication
router.use(authenticate);

router.get('/', activityLogController.getRecentActivities);

export default router;

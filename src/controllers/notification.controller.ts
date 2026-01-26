import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import notificationService from '../services/notification.service';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/AppError';

class NotificationController {
    /**
     * Get all notifications for the authenticated user
     * Categorized into newNotifications and oldNotifications
     */
    getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;

        const data = await notificationService.getUserNotifications(userId);

        res.status(200).json({
            success: true,
            data,
        });
    });

    /**
     * Mark a notification as read
     */
    markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const { id } = req.params;

        if (!id) {
            throw new AppError('Notification ID is required', 400, 'INVALID_REQUEST');
        }

        const notification = await notificationService.markAsRead(id as string, userId);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    });
}

export default new NotificationController();

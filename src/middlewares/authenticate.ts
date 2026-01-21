import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError';
import { User, IUser } from '../models/user.model';
import { BlacklistedToken } from '../models/blacklistedToken.model';

export interface AuthRequest extends Request {
    token?: string; // Add token to request for easier logout access
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // 1) Check if token is blacklisted
        const isBlacklisted = await BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError('This token is no longer valid. Please log in again.', 401));
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key') as { userId: string; role: string };

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // Attach token and user to request
        req.token = token;
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (err) {
        next(new AppError('Invalid token. Please log in again!', 401));
    }
};

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
// import AppError from './utils/AppError';
// import globalErrorHandler from './middlewares/errorMiddleware';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import foodRoutes from './routes/food.routes';
import orderRoutes from './routes/order.routes';
import dashboardRoutes from './routes/dashboard.routes';
import providerRoutes from './routes/provider.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import feedRoutes from './routes/feed.routes';
import uploadRoutes from './services/cloudinary.service';
import globalErrorHandler from './middlewares/errorMiddleware';
import AppError from './utils/AppError';

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(cors());

if (config.env === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2) ROUTES
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/feed', feedRoutes);


app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to the EMDR Backend API (TypeScript)!'
    });
});

// 3) UNHANDLED ROUTES (404 Handler)
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

export default app;

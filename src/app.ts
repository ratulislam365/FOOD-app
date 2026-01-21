import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config';
import AppError from './utils/AppError';
import globalErrorHandler from './middlewares/errorMiddleware';
import authRoutes from './routes/auth.routes';

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(cors());

if (config.env === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2) ROUTES
app.use('/api/v1/auth', authRoutes);

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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            errorCode: err.errorCode,
            message: err.message,
            status: err.status,
            stack: err.stack,
            error: err,
        });
    }
    else {
        // Production mode
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                errorCode: err.errorCode,
                message: err.message,
            });
        }
        else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                success: false,
                errorCode: 'INTERNAL_SERVER_ERROR',
                message: 'Something went very wrong!',
            });
        }
    }
};
exports.default = globalErrorHandler;

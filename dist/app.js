"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = __importDefault(require("./config"));
const AppError_1 = __importDefault(require("./utils/AppError"));
const errorMiddleware_1 = __importDefault(require("./middlewares/errorMiddleware"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const cloudinary_service_1 = __importDefault(require("./services/cloudinary.service"));
const app = (0, express_1.default)();
// 1) GLOBAL MIDDLEWARES
app.use((0, cors_1.default)());
if (config_1.default.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// 2) ROUTES
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api', cloudinary_service_1.default);
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the EMDR Backend API (TypeScript)!'
    });
});
// 3) UNHANDLED ROUTES (404 Handler)
app.use((req, res, next) => {
    next(new AppError_1.default(`Can't find ${req.originalUrl} on this server!`, 404));
});
// 4) GLOBAL ERROR HANDLING MIDDLEWARE
app.use(errorMiddleware_1.default);
exports.default = app;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const user_model_1 = require("../models/user.model");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const authenticate = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError_1.default('You are not logged in! Please log in to get access.', 401, 'AUTH_ERROR'));
        }
        // 1) Check if token is blacklisted
        const isBlacklisted = await blacklistedToken_model_1.BlacklistedToken.findOne({ token });
        if (isBlacklisted) {
            return next(new AppError_1.default('This token is no longer valid. Please log in again.', 401, 'AUTH_ERROR'));
        }
        // 2) Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'super-secret-key');
        // Check if user still exists
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user) {
            return next(new AppError_1.default('The user belonging to this token no longer exists.', 401, 'AUTH_ERROR'));
        }
        // Attach token and user to request
        req.token = token;
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        next(new AppError_1.default('Invalid token. Please log in again!', 401, 'AUTH_ERROR'));
    }
};
exports.authenticate = authenticate;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const catchAsync_1 = require("../utils/catchAsync");
class AuthController {
    constructor() {
        this.signup = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const result = await auth_service_1.default.signup(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        });
        this.verifyEmail = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const { email, otp } = req.body;
            const result = await auth_service_1.default.verifyEmail(email, otp);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
        this.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const { email, password } = req.body;
            const result = await auth_service_1.default.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
        this.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const token = req.token;
            if (!token) {
                throw new Error('Already logged out or no token provided');
            }
            const result = await auth_service_1.default.logout(token);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
        this.forgotPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const { email } = req.body;
            const result = await auth_service_1.default.forgotPassword(email);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
        this.verifyForgotOtp = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const { email, otp } = req.body;
            const result = await auth_service_1.default.verifyForgotOtp(email, otp);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
        this.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const { newPassword } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new Error('Authentication required');
            }
            const result = await auth_service_1.default.resetPassword(userId, newPassword);
            res.status(200).json({
                success: true,
                data: result,
            });
        });
    }
}
exports.default = new AuthController();

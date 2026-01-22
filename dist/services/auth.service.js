"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
const otp_model_1 = require("../models/otp.model");
const authUtils_1 = require("../utils/authUtils");
const AppError_1 = __importDefault(require("../utils/AppError"));
const emailService_1 = require("../utils/emailService");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    async logout(token) {
        // 1) Decode token to get expiry (without verifying again, as middleware already verified it)
        const decoded = jsonwebtoken_1.default.decode(token);
        // 2) Add to blacklist until it would have expired naturally
        // exp is in seconds, convert to Date
        const expiresAt = new Date(decoded.exp * 1000);
        await blacklistedToken_model_1.BlacklistedToken.create({
            token,
            expiresAt,
        });
        return { message: 'Logged out successfully' };
    }
    async signup(data) {
        const { fullName, email, password, role } = data;
        // Check if user exists
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            throw new AppError_1.default('Email already exists', 400);
        }
        // Hash password
        const passwordHash = await (0, authUtils_1.hashPassword)(password);
        // Create user
        const user = await user_model_1.User.create({
            fullName,
            email,
            passwordHash,
            role: role || user_model_1.UserRole.CUSTOMER,
            isEmailVerified: false,
            authProvider: 'email',
        });
        // Generate OTP
        const rawOtp = (0, authUtils_1.generateOtp)();
        const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
        // Clear any existing verification OTPs for this email
        await otp_model_1.Otp.deleteMany({ email: email.toLowerCase().trim(), purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
        // Save OTP
        await otp_model_1.Otp.create({
            email: email.toLowerCase().trim(),
            otp: hashedOtp,
            purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
        // Send OTP via Email
        await (0, emailService_1.sendEmail)({
            email,
            subject: 'Email Verification OTP',
            message: `Welcome to EMDR! Your verification code is: ${rawOtp}. This code expires in 10 minutes.`,
        });
        const accessToken = (0, authUtils_1.generateToken)({ userId: user._id.toString(), role: user.role });
        const refreshToken = (0, authUtils_1.generateRefreshToken)({ userId: user._id.toString(), role: user.role });
        return {
            message: 'OTP sent successfully for email verification.',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isEmailVerified,
                authProvider: user.authProvider,
            },
            session: {
                accessToken,
                refreshToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
        };
    }
    async verifyEmail(email, otp) {
        const normalizedEmail = email.toLowerCase().trim();
        // 1) Find the OTP record
        const otpRecord = await otp_model_1.Otp.findOne({
            email: normalizedEmail,
            purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY,
        });
        if (!otpRecord) {
            // Check if user is already verified
            const user = await user_model_1.User.findOne({ email: normalizedEmail });
            if (user?.isEmailVerified) {
                return { message: 'Email already verified' };
            }
            throw new AppError_1.default('Invalid or expired OTP', 400);
        }
        // 2) Compare hashed OTP
        if (!(0, authUtils_1.compareOtp)(otp, otpRecord.otp)) {
            throw new AppError_1.default('Invalid OTP', 400);
        }
        // 3) Mark user as verified
        await user_model_1.User.findOneAndUpdate({ email: normalizedEmail }, { isEmailVerified: true });
        // 4) Delete all validation OTPs for this user
        await otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.EMAIL_VERIFY });
        return { message: 'Email verified successfully' };
    }
    async login(email, password) {
        const user = await user_model_1.User.findOne({ email }).select('+passwordHash');
        if (!user || !(await (0, authUtils_1.comparePassword)(password, user.passwordHash))) {
            throw new AppError_1.default('Invalid email or password', 401);
        }
        if (!user.isEmailVerified) {
            throw new AppError_1.default('Please verify your email first', 401);
        }
        const accessToken = (0, authUtils_1.generateToken)({
            userId: user._id.toString(),
            role: user.role
        });
        const refreshToken = (0, authUtils_1.generateRefreshToken)({
            userId: user._id.toString(),
            role: user.role
        });
        return {
            message: 'Logged in successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isEmailVerified,
                authProvider: user.authProvider,
            },
            session: {
                accessToken,
                refreshToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            }
        };
    }
    async forgotPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await user_model_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            throw new AppError_1.default('If an account with that email exists, we have sent an OTP', 200);
        }
        const rawOtp = (0, authUtils_1.generateOtp)();
        const hashedOtp = (0, authUtils_1.hashOtp)(rawOtp);
        // Clear any existing reset OTPs for this email
        await otp_model_1.Otp.deleteMany({ email: normalizedEmail, purpose: otp_model_1.OtpPurpose.RESET_PASSWORD });
        await otp_model_1.Otp.create({
            email: normalizedEmail,
            otp: hashedOtp,
            purpose: otp_model_1.OtpPurpose.RESET_PASSWORD,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        // Send Reset OTP via Email
        await (0, emailService_1.sendEmail)({
            email: normalizedEmail,
            subject: 'Password Reset OTP',
            message: `Use this code to reset your password: ${rawOtp}. This code expires in 10 minutes.`,
        });
        return { message: 'OTP sent to your email' };
    }
    async verifyForgotOtp(email, otp) {
        const normalizedEmail = email.toLowerCase().trim();
        const otpRecord = await otp_model_1.Otp.findOne({
            email: normalizedEmail,
            purpose: otp_model_1.OtpPurpose.RESET_PASSWORD,
        });
        if (!otpRecord) {
            throw new AppError_1.default('Invalid or expired OTP', 400);
        }
        if (!(0, authUtils_1.compareOtp)(otp, otpRecord.otp)) {
            throw new AppError_1.default('Invalid OTP', 400);
        }
        const user = await user_model_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            throw new AppError_1.default('User not found', 404);
        }
        const accessToken = (0, authUtils_1.generateToken)({
            userId: user._id.toString(),
            role: user.role
        });
        return {
            message: 'OTP verified successfully. You can now reset your password.',
            accessToken
        };
    }
    async resetPassword(userId, newPassword) {
        const passwordHash = await (0, authUtils_1.hashPassword)(newPassword);
        const user = await user_model_1.User.findByIdAndUpdate(userId, { passwordHash }, { new: true });
        if (!user) {
            throw new AppError_1.default('User not found', 404);
        }
        // Clear all reset OTPs for this user
        await otp_model_1.Otp.deleteMany({ email: user.email, purpose: otp_model_1.OtpPurpose.RESET_PASSWORD });
        return { message: 'Password reset successful' };
    }
}
exports.default = new AuthService();

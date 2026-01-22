"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOtp = exports.hashOtp = exports.generateOtp = exports.comparePassword = exports.hashPassword = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'super-secret-key';
    const options = {
        expiresIn: process.env.JWT_EXPIRE || '1h',
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key';
    const options = {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateRefreshToken = generateRefreshToken;
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, 12);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return await bcrypt_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};
exports.generateOtp = generateOtp;
const hashOtp = (otp) => {
    return crypto_1.default.createHash('sha256').update(otp).digest('hex');
};
exports.hashOtp = hashOtp;
const compareOtp = (otp, hashedOtp) => {
    const hash = crypto_1.default.createHash('sha256').update(otp).digest('hex');
    return hash === hashedOtp;
};
exports.compareOtp = compareOtp;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const validate_1 = require("../middlewares/validate");
const authenticate_1 = require("../middlewares/authenticate");
const auth_validation_1 = require("../validations/auth.validation");
const router = express_1.default.Router();
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    message: {
        status: 'fail',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});
router.use(authLimiter);
router.post('/signup', (0, validate_1.validate)(auth_validation_1.signupSchema), auth_controller_1.default.signup);
router.post('/verify-email', (0, validate_1.validate)(auth_validation_1.verifyEmailSchema), auth_controller_1.default.verifyEmail);
router.post('/login', (0, validate_1.validate)(auth_validation_1.loginSchema), auth_controller_1.default.login);
router.post('/logout', authenticate_1.authenticate, auth_controller_1.default.logout);
router.post('/forgot-password', (0, validate_1.validate)(auth_validation_1.forgotPasswordSchema), auth_controller_1.default.forgotPassword);
router.post('/verify-forgot-otp', (0, validate_1.validate)(auth_validation_1.verifyForgotOtpSchema), auth_controller_1.default.verifyForgotOtp);
router.post('/reset-password', authenticate_1.authenticate, (0, validate_1.validate)(auth_validation_1.resetPasswordSchema), auth_controller_1.default.resetPassword);
exports.default = router;

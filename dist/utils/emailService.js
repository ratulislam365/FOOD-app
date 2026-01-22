"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const sendEmail = async (options) => {
    // 1) Fallback for development if SMTP is not configured
    if (config_1.default.env === 'development' &&
        (config_1.default.email.user === 'your_smtp_user' || !config_1.default.email.user)) {
        console.log('-----------------------------------------');
        console.log('📧 [DEVELOPMENT MODE] Email Mock:');
        console.log(`To:      ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('-----------------------------------------');
        return; // Skip actual sending
    }
    // 2) Create a transporter
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.default.email.host,
        port: config_1.default.email.port,
        auth: {
            user: config_1.default.email.user,
            pass: config_1.default.email.pass,
        },
    });
    // 3) Define the email options
    const mailOptions = {
        from: `${config_1.default.email.fromName} <${config_1.default.email.fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    // 4) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    }
    catch (error) {
        console.error('Email sending failed:', error);
        // In production, we throw this error
        if (config_1.default.env === 'production') {
            throw new Error('Email could not be sent. Please try again later.');
        }
        else {
            console.log('⚠️ [DEV ERROR] SMTP Failed but continuing because of development mode.');
        }
    }
};
exports.sendEmail = sendEmail;

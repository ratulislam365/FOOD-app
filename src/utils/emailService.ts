import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

export const sendEmail = async (options: EmailOptions) => {
    // 1) Fallback for development if SMTP is not configured
    if (
        config.env === 'development' &&
        (config.email.user === 'your_smtp_user' || !config.email.user)
    ) {
        console.log('-----------------------------------------');
        console.log('📧 [DEVELOPMENT MODE] Email Mock:');
        console.log(`To:      ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('-----------------------------------------');
        return; // Skip actual sending
    }

    // 2) Create a transporter
    const transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });

    // 3) Define the email options
    const mailOptions = {
        from: `${config.email.fromName} <${config.email.fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 4) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Email sending failed:', error);
        // In production, we throw this error
        if (config.env === 'production') {
            throw new Error('Email could not be sent. Please try again later.');
        } else {
            console.log('⚠️ [DEV ERROR] SMTP Failed but continuing because of development mode.');
        }
    }
};

import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

export const sendEmail = async (options: EmailOptions) => {

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
        return; 
    }

    const transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });

    const mailOptions = {
        from: `${config.email.fromName} <${config.email.fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Email sending failed:', error);
        if (config.env === 'production') {
            throw new Error('Email could not be sent. Please try again later.');
        } else {
            console.log('⚠️ [DEV ERROR] SMTP Failed but continuing because of development mode.');
        }
    }
};

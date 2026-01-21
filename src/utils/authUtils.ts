import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const generateToken = (payload: { userId: string; role: string }): string => {
    const secret: Secret = process.env.JWT_SECRET || 'super-secret-key';
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRE as any) || '1h',
    };
    return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: { userId: string; role: string }): string => {
    const secret: Secret = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key';
    const options: SignOptions = {
        expiresIn: (process.env.JWT_REFRESH_EXPIRE as any) || '7d',
    };
    return jwt.sign(payload, secret, options);
};

export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};

export const hashOtp = (otp: string): string => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

export const compareOtp = (otp: string, hashedOtp: string): boolean => {
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    return hash === hashedOtp;
};

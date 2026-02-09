import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
    userId: Types.ObjectId;
    refreshToken: string; // Hashed refresh token
    accessToken: string; // Hashed access token (for revocation)
    
    // Device information
    deviceId: string; // Unique identifier for the device
    deviceName?: string; // e.g., "Chrome on Windows", "iPhone 13"
    deviceType?: 'web' | 'mobile' | 'tablet' | 'desktop';
    userAgent?: string;
    
    // Location & Security
    ipAddress?: string;
    country?: string;
    city?: string;
    lastActivityAt: Date;
    
    // Token metadata
    issuedAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt?: Date;
    revokedReason?: string; // 'user_logout' | 'security_breach' | 'token_rotation' | 'admin_action'
    
    // Refresh token rotation tracking
    tokenFamily: string; // UUID to track token lineage
    previousTokenId?: Types.ObjectId; // Reference to previous session in rotation chain
    
    createdAt: Date;
    updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        refreshToken: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        accessToken: {
            type: String,
            required: true,
            index: true,
        },
        
        // Device information
        deviceId: {
            type: String,
            required: true,
            index: true,
        },
        deviceName: {
            type: String,
        },
        deviceType: {
            type: String,
            enum: ['web', 'mobile', 'tablet', 'desktop'],
        },
        userAgent: {
            type: String,
        },
        
        // Location & Security
        ipAddress: {
            type: String,
        },
        country: {
            type: String,
        },
        city: {
            type: String,
        },
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },
        
        // Token metadata
        issuedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - auto-delete expired sessions
        },
        isRevoked: {
            type: Boolean,
            default: false,
            index: true,
        },
        revokedAt: {
            type: Date,
        },
        revokedReason: {
            type: String,
        },
        
        // Token rotation
        tokenFamily: {
            type: String,
            required: true,
            index: true,
        },
        previousTokenId: {
            type: Schema.Types.ObjectId,
            ref: 'Session',
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
sessionSchema.index({ userId: 1, isRevoked: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ tokenFamily: 1, isRevoked: 1 });

export const Session = model<ISession>('Session', sessionSchema);

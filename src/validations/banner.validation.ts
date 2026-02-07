import { z } from 'zod';
import { BannerStatus } from '../models/banner.model';

export const createBannerSchema = z.object({
    body: z.object({
        title: z.string().trim().min(3).max(100),
        bannerImage: z.string().url('Invalid image URL'),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        status: z.nativeEnum(BannerStatus).optional(),
    }).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
        message: "End time must be after start time",
        path: ["endTime"],
    }),
});

export const updateBannerSchema = z.object({
    body: z.object({
        title: z.string().trim().min(3).max(100).optional(),
        bannerImage: z.string().url().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        status: z.nativeEnum(BannerStatus).optional(),
    }).refine((data) => {
        if (data.startTime && data.endTime) {
            return new Date(data.startTime) < new Date(data.endTime);
        }
        return true;
    }, {
        message: "End time must be after start time",
        path: ["endTime"],
    }),
});

export const getBannersQuerySchema = z.object({
    query: z.object({
        status: z.nativeEnum(BannerStatus).optional(),
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
    }),
});

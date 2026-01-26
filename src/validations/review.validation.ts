import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        orderId: z.string().min(1, 'Order ID is required'), // Can be custom or Mongo ID
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().min(5).max(500),
    }),
});

export const replyReviewSchema = z.object({
    body: z.object({
        comment: z.string().trim().min(2).max(500),
    }),
});

export const updateReviewSchema = z.object({
    body: z.object({
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().trim().min(5).max(500).optional(),
    }),
});

export const getReviewsQuerySchema = z.object({
    query: z.object({
        rating: z.string().regex(/^[1-5]$/).optional(),
        customerName: z.string().trim().optional(),
        page: z.string().regex(/^\d+$/).optional().default('1'),
        limit: z.string().regex(/^\d+$/).optional().default('10'),
    }),
});

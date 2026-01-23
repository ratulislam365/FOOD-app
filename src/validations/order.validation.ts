import { z } from 'zod';

export const getOrdersQuerySchema = z.object({
    query: z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID').optional(),
        customerName: z.string().trim().min(2).max(50).optional(),
        status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
        page: z.string().regex(/^\d+$/).optional().default('1'),
        limit: z.string().regex(/^\d+$/).optional().default('10'),
    }),
});

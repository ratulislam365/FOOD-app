import { z } from 'zod';

export const getFeedSchema = z.object({
    query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

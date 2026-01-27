import { z } from 'zod';

export const getFeedSchema = z.object({
    query: z.object({
        categoryName: z
            .string()
            .trim()
            .min(2, 'Category name must be at least 2 characters')
            .max(50, 'Category name cannot exceed 50 characters')
            .optional(),
        minRating: z
            .string()
            .transform((val) => parseFloat(val))
            .pipe(z.number().min(0).max(5))
            .optional(),
        page: z
            .string()
            .optional()
            .default('1')
            .transform((val) => parseInt(val))
            .pipe(z.number().int().positive()),
        limit: z
            .string()
            .optional()
            .default('10')
            .transform((val) => parseInt(val))
            .pipe(z.number().int().positive()),
    }),
});

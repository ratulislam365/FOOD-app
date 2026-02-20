import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        profile: z.string().url('Profile must be a valid URL').optional(),
        restaurantName: z.string().trim().min(2).max(100).optional(),
        contactEmail: z.string().email('Invalid email format').optional(),
        phoneNumber: z.string().optional(),
        restaurantAddress: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        location: z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180)
        }).optional(),
        cuisine: z.array(z.string()).optional(),
    }),
});

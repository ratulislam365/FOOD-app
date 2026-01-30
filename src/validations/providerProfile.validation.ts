import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        profile: z.string().url('Profile must be a valid URL').optional(),
        restaurantName: z.string().trim().min(2).max(100).optional(),
        contactEmail: z.string().email('Invalid email format').optional(),
        phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
        restaurantAddress: z.string().min(5, 'Address is too short').optional(),
    }),
});

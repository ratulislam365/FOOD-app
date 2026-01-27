import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Basic international phone validation

const ageValidator = (dob: Date) => {
    const today = new Date();
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    return dob <= tenYearsAgo;
};

export const createProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format'),
        dateOfBirth: z.string().transform((val) => new Date(val)).refine(ageValidator, {
            message: 'Age must be at least 10 years',
        }),
        address: z.string().trim().min(5),
        profilePic: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format').optional(),
        dateOfBirth: z.string().transform((val) => new Date(val)).refine(ageValidator, {
            message: 'Age must be at least 10 years',
        }).optional(),
        address: z.string().trim().min(5).optional(),
        profilePic: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
    }),
});

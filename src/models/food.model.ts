import { Schema, model, Document, Types } from 'mongoose';

export interface IFood extends Document {
    providerId: Types.ObjectId;
    categoryId: Types.ObjectId;
    title: string; // "name" in search requirements, mapping handled in API
    description?: string;
    image?: string;
    baseRevenue: number;
    serviceFee: number;
    finalPriceTag: number; // "price"
    rating: number; // New field for search
    foodStatus: boolean; // Active/Inactive
    foodAvailability: boolean; // In Stock/Out of Stock
    createdAt: Date;
    updatedAt: Date;
}

const foodSchema = new Schema<IFood>(
    {
        providerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            index: true // Indexed for search
        },
        description: {
            type: String,
            trim: true
        },
        image: {
            type: String
        },
        baseRevenue: {
            type: Number,
            required: true,
            min: 0
        },
        serviceFee: {
            type: Number,
            required: true,
            min: 0
        },
        finalPriceTag: {
            type: Number,
            required: true,
            min: 0
        },
        rating: {
            type: Number,
            default: 0,
            max: 5,
            index: true // Indexed for search
        },
        foodStatus: {
            type: Boolean,
            default: true // Active
        },
        foodAvailability: {
            type: Boolean,
            default: true // Available
        }
    },
    {
        timestamps: true,
    }
);


foodSchema.index({ categoryId: 1, rating: -1 });

export const Food = model<IFood>('Food', foodSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_model_1 = require("../models/category.model");
const AppError_1 = __importDefault(require("../utils/AppError"));
const mongoose_1 = require("mongoose");
class CategoryService {
    async createCategory(providerId, categoryName) {
        // Check if category already exists for this provider
        const existingCategory = await category_model_1.Category.findOne({
            providerId: new mongoose_1.Types.ObjectId(providerId),
            categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') }, // Case-insensitive check
        });
        if (existingCategory) {
            throw new AppError_1.default('Category with this name already exists for your profile', 400, 'DUPLICATE_CATEGORY_ERROR');
        }
        const category = await category_model_1.Category.create({
            categoryName,
            providerId: new mongoose_1.Types.ObjectId(providerId),
        });
        return category;
    }
    async getProviderCategories(providerId) {
        return await category_model_1.Category.find({ providerId: new mongoose_1.Types.ObjectId(providerId) }).sort('-createdAt');
    }
    async updateCategory(categoryId, providerId, updateData) {
        const category = await category_model_1.Category.findOne({
            _id: new mongoose_1.Types.ObjectId(categoryId),
            providerId: new mongoose_1.Types.ObjectId(providerId),
        });
        if (!category) {
            throw new AppError_1.default('Category not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
        }
        // If name is being updated, check for duplicates
        if (updateData.categoryName && updateData.categoryName !== category.categoryName) {
            const existing = await category_model_1.Category.findOne({
                providerId: new mongoose_1.Types.ObjectId(providerId),
                categoryName: { $regex: new RegExp(`^${updateData.categoryName}$`, 'i') },
                _id: { $ne: category._id },
            });
            if (existing) {
                throw new AppError_1.default('Another category with this name already exists', 400, 'DUPLICATE_CATEGORY_ERROR');
            }
        }
        Object.assign(category, updateData);
        await category.save();
        return category;
    }
    async softDeleteCategory(categoryId, providerId) {
        const category = await category_model_1.Category.findOneAndUpdate({
            _id: new mongoose_1.Types.ObjectId(categoryId),
            providerId: new mongoose_1.Types.ObjectId(providerId),
        }, { categoryStatus: false }, { new: true });
        if (!category) {
            throw new AppError_1.default('Category not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
        }
        return category;
    }
}
exports.default = new CategoryService();

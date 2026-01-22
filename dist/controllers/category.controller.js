"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_service_1 = __importDefault(require("../services/category.service"));
const catchAsync_1 = require("../utils/catchAsync");
class CategoryController {
    constructor() {
        this.createCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const providerId = req.user.userId;
            const { categoryName } = req.body;
            const category = await category_service_1.default.createCategory(providerId, categoryName);
            res.status(201).json({
                success: true,
                data: category,
            });
        });
        this.getOwnCategories = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const providerId = req.user.userId;
            const categories = await category_service_1.default.getProviderCategories(providerId);
            res.status(200).json({
                success: true,
                results: categories.length,
                data: categories,
            });
        });
        this.updateCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const providerId = req.user.userId;
            const categoryId = req.params.id;
            const category = await category_service_1.default.updateCategory(categoryId, providerId, req.body);
            res.status(200).json({
                success: true,
                data: category,
            });
        });
        this.deleteCategory = (0, catchAsync_1.catchAsync)(async (req, res) => {
            const providerId = req.user.userId;
            const categoryId = req.params.id;
            await category_service_1.default.softDeleteCategory(categoryId, providerId);
            res.status(200).json({
                success: true,
                message: 'Category disabled successfully',
            });
        });
    }
}
exports.default = new CategoryController();

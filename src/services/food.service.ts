import { Food } from '../models/food.model';
import { Category } from '../models/category.model';
import AppError from '../utils/AppError';
import { Types } from 'mongoose';

class FoodService {
    /**
     * Helper to identify if category belongs to the provider
     */
    private async verifyCategoryOwnership(categoryId: string, providerId: string) {
        const category = await Category.findOne({
            _id: new Types.ObjectId(categoryId),
            providerId: new Types.ObjectId(providerId),
        });

        if (!category) {
            throw new AppError('Category not found or does not belong to you', 403, 'CATEGORY_OWNERSHIP_ERROR');
        }
        return category;
    }

    async createFood(providerId: string, foodData: any) {
        const { categoryId, title, baseRevenue, serviceFee } = foodData;

        // 1. Verify Category Ownership
        await this.verifyCategoryOwnership(categoryId, providerId);

        // 2. Check for duplicate title in the same category
        const existingFood = await Food.findOne({
            categoryId: new Types.ObjectId(categoryId),
            title: { $regex: new RegExp(`^${title}$`, 'i') },
        });

        if (existingFood) {
            throw new AppError('Food item with this title already exists in this category', 400, 'DUPLICATE_FOOD_ERROR');
        }

        // 3. Calculate final price server-side
        const finalPriceTag = Number(baseRevenue) + Number(serviceFee);

        // 4. Create Food Item
        const food = await Food.create({
            ...foodData,
            providerId: new Types.ObjectId(providerId),
            categoryId: new Types.ObjectId(categoryId),
            finalPriceTag,
        });

        return food;
    }

    async getProviderFoods(providerId: string) {
        return await Food.find({ providerId: new Types.ObjectId(providerId) })
            .populate('categoryId', 'categoryName')
            .sort('-createdAt');
    }

    async getFoodsByCategory(categoryId: string, providerId: string) {
        await this.verifyCategoryOwnership(categoryId, providerId);

        return await Food.find({
            categoryId: new Types.ObjectId(categoryId),
            providerId: new Types.ObjectId(providerId),
        }).sort('-createdAt');
    }

    async getFoodById(foodId: string, providerId: string) {
        const food = await Food.findOne({
            _id: new Types.ObjectId(foodId),
            providerId: new Types.ObjectId(providerId),
        }).populate('categoryId', 'categoryName');

        if (!food) {
            throw new AppError('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
        }

        return food;
    }

    async updateFood(foodId: string, providerId: string, updateData: any) {
        const food = await Food.findOne({
            _id: new Types.ObjectId(foodId),
            providerId: new Types.ObjectId(providerId),
        });

        if (!food) {
            throw new AppError('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
        }

        // If changing category, verify ownership of new category
        if (updateData.categoryId && updateData.categoryId.toString() !== food.categoryId.toString()) {
            await this.verifyCategoryOwnership(updateData.categoryId, providerId);
        }

        // Re-calculate price if revenue or fee changes
        if (updateData.baseRevenue !== undefined || updateData.serviceFee !== undefined) {
            const br = updateData.baseRevenue !== undefined ? updateData.baseRevenue : food.baseRevenue;
            const sf = updateData.serviceFee !== undefined ? updateData.serviceFee : food.serviceFee;
            updateData.finalPriceTag = Number(br) + Number(sf);
        }

        // Check title duplicate if changed
        if (updateData.title && updateData.title !== food.title) {
            const catId = updateData.categoryId || food.categoryId;
            const existing = await Food.findOne({
                categoryId: new Types.ObjectId(catId),
                title: { $regex: new RegExp(`^${updateData.title}$`, 'i') },
                _id: { $ne: food._id },
            });

            if (existing) {
                throw new AppError('Another food item with this title already exists in this category', 400, 'DUPLICATE_FOOD_ERROR');
            }
        }

        Object.assign(food, updateData);
        await food.save();

        return food;
    }

    async deleteFood(foodId: string, providerId: string) {
        const food = await Food.findOneAndDelete({
            _id: new Types.ObjectId(foodId),
            providerId: new Types.ObjectId(providerId),
        });

        if (!food) {
            throw new AppError('Food item not found or you do not have permission', 404, 'NOT_FOUND_ERROR');
        }

        return food;
    }
}

export default new FoodService();

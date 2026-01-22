import { Response } from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import foodService from '../services/food.service';
import { catchAsync } from '../utils/catchAsync';

class FoodController {
    createFood = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const food = await foodService.createFood(providerId, req.body);

        res.status(201).json({
            success: true,
            data: food,
        });
    });

    getOwnFoods = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const foods = await foodService.getProviderFoods(providerId);

        res.status(200).json({
            success: true,
            results: foods.length,
            data: foods,
        });
    });

    getFoodsByCategory = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const categoryId = req.params.categoryId as string;
        const foods = await foodService.getFoodsByCategory(categoryId, providerId);

        res.status(200).json({
            success: true,
            results: foods.length,
            data: foods,
        });
    });

    getFoodById = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const foodId = req.params.id as string;

        const food = await foodService.getFoodById(foodId, providerId);

        res.status(200).json({
            success: true,
            data: food,
        });
    });

    updateFood = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const foodId = req.params.id as string;
        const food = await foodService.updateFood(foodId, providerId, req.body);

        res.status(200).json({
            success: true,
            data: food,
        });
    });

    deleteFood = catchAsync(async (req: AuthRequest, res: Response) => {
        const providerId = req.user!.userId;
        const foodId = req.params.id as string;
        await foodService.deleteFood(foodId, providerId);

        res.status(200).json({
            success: true,
            message: 'Food item deleted successfully from database',
        });
    });
}

export default new FoodController();

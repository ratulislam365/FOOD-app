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
        const result = await foodService.getProviderFoods(providerId, req.query);

        res.status(200).json({
            success: true,
            results: result.foods.length,
            meta: result.meta,
            data: result.foods,
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

    searchFoods = catchAsync(async (req: AuthRequest, res: Response) => {
        const result = await foodService.searchPublicFoods(req.query);

        // Format data to match specs: name mapped from title, price from finalPriceTag
        const formattedData = result.foods.map((food: any) => ({
            food_id: food._id,
            name: food.title,
            category: food.categoryId?.categoryName || 'Unknown',
            provider: (food.providerId as any)?.fullName || 'Unknown', // Simulating provider name
            rating: food.rating || 0,
            price: food.finalPriceTag,
            productDescription: food.productDescription,
            image: food.image
        }));

        res.status(200).json({
            success: true,
            page: result.page,
            limit: result.limit,
            total: result.total,
            data: formattedData
        });
    });
}

export default new FoodController();

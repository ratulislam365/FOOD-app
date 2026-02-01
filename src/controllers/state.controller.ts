import { Request, Response } from 'express';
import stateService from '../services/state.service';
import { catchAsync } from '../utils/catchAsync';

class StateController {
    /**
     * GET /api/v1/states
     * Get all active states for dropdown/selection
     */
    getAllStates = catchAsync(async (req: Request, res: Response) => {
        const states = await stateService.getAllStates();

        res.status(200).json({
            success: true,
            count: states.length,
            data: states,
        });
    });

    /**
     * GET /api/v1/states/search?q=california
     * Search states (autocomplete)
     */
    searchStates = catchAsync(async (req: Request, res: Response) => {
        const query = req.query.q as string;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters',
            });
        }

        const states = await stateService.searchStates(query);

        res.status(200).json({
            success: true,
            count: states.length,
            data: states,
        });
    });
}

export default new StateController();

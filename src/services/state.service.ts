import { State } from '../models/state.model';

class StateService {
    /**
     * Get all active states (for dropdowns, etc.)
     */
    async getAllStates() {
        return await State.find({ isActive: true })
            .select('_id name code')
            .sort({ name: 1 })
            .lean();
    }

    /**
     * Get state by ID
     */
    async getStateById(stateId: string) {
        return await State.findOne({ _id: stateId, isActive: true }).lean();
    }

    /**
     * Get state by code
     */
    async getStateByCode(code: string) {
        return await State.findOne({
            code: code.toUpperCase(),
            isActive: true,
        }).lean();
    }

    /**
     * Search states by name (for autocomplete)
     */
    async searchStates(query: string) {
        const regex = new RegExp(query, 'i');
        return await State.find({
            name: { $regex: regex },
            isActive: true,
        })
            .select('_id name code')
            .limit(10)
            .lean();
    }
}

export default new StateService();

import customerOrderService from '../services/customerOrder.service';

/**
 * Initialize background jobs
 */
export const initJobs = () => {
    console.log('[JOBS] Initializing background jobs...');

    // Run order cleanup every 24 hours
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

    setInterval(async () => {
        try {
            console.log('[JOBS] Running scheduled order cleanup...');
            await customerOrderService.cleanupOldOrders();
        } catch (error) {
            console.error('[JOBS] Error during order cleanup:', error);
        }
    }, CLEANUP_INTERVAL);

    // Run immediately once on startup
    customerOrderService.cleanupOldOrders().catch(err => {
        console.error('[JOBS] Initial cleanup failed:', err);
    });
};

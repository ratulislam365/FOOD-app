import { Types } from 'mongoose';
import { Order, IOrder, OrderStatus } from '../models/order.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { User } from '../models/user.model';
import AppError from '../utils/AppError';

interface OrderItemDetail {
    name: string;
    quantity: number;
    pricePerItem: number;
    totalPrice: number;
}

interface OrderTimeline {
    status: string;
    time: Date;
}

interface OrderDetailsResponse {
    orderId: string;
    status: string;
    createdAt: Date;
    items: OrderItemDetail[];
    pricing: {
        subtotal: number;
        stateTax: number;
        platformFee: number;
        total: number;
    };
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    restaurant: {
        name: string;
        address: string;
        providerId: string;
    };
    timeline: OrderTimeline[];
}

class AdminOrderService {
    /**
     * Get full order details for Admin
     * 
     * @param providerId - The provider's ID
     * @param orderId - The Order ID (custom string ID, e.g. ORD-001)
     */
    async getOrderDetails(providerId: string, orderId: string): Promise<OrderDetailsResponse> {
        const providerObjectId = new Types.ObjectId(providerId);

        // 1. Find the order
        const order = await Order.findOne({
            orderId: orderId,
            providerId: providerObjectId
        })
            .populate('customerId', 'fullName email phone')
            .populate('items.foodId', 'name price');

        if (!order) {
            throw new AppError('Order not found or does not belong to this provider', 404);
        }

        // 2. Get Restaurant Info
        const providerProfile = await ProviderProfile.findOne({ providerId: providerObjectId });
        const restaurantName = providerProfile?.restaurantName || 'Unknown Restaurant';
        const restaurantAddress = `${providerProfile?.restaurantAddress || ''}, ${providerProfile?.city || ''}, ${providerProfile?.state || ''}, ${providerProfile?.zipCode || ''}`;

        // 3. Format Items
        const formattedItems: OrderItemDetail[] = order.items.map((item: any) => ({
            name: item.foodId?.name || 'Unknown Item',
            quantity: item.quantity,
            pricePerItem: item.price,
            totalPrice: item.quantity * item.price
        }));

        // 4. Calculate Pricing Breakdown
        // Assuming subtotal is sum of item prices. If stored differently, adjust.
        const subtotal = formattedItems.reduce((acc, item) => acc + item.totalPrice, 0);
        // Tax logic depends on how it's stored. Schema doesn't have tax field explicitly in provided view, 
        // using totalPrice - subtotal - platformFee as a proxy or 0 if not available.
        // Or if simple tax logic:
        const platformFee = order.platformFee || 0;
        const total = order.totalPrice;
        // Basic reverse calc if tax isn't stored:
        const potentialTax = parseFloat((total - subtotal - platformFee).toFixed(2));
        const stateTax = potentialTax > 0 ? potentialTax : 0;

        // 5. Format Timeline
        // If orderStatusHistory exists, use it. Else fallback to createdAt/updatedAt
        let timeline: OrderTimeline[] = [];
        if (order.orderStatusHistory && order.orderStatusHistory.length > 0) {
            timeline = order.orderStatusHistory.map(history => ({
                status: history.status,
                time: history.timestamp
            }));
        } else {
            // Fallback if history tracking wasn't active
            timeline.push({ status: 'Order Placed', time: order.createdAt });
            if (order.status === OrderStatus.COMPLETED) {
                timeline.push({ status: 'Completed', time: order.updatedAt });
            }
        }

        // Sort timeline
        timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        // 6. Construct Response
        const customer = (order.customerId as any);

        return {
            orderId: order.orderId,
            status: order.status,
            createdAt: order.createdAt,
            items: formattedItems,
            pricing: {
                subtotal: parseFloat(subtotal.toFixed(2)),
                stateTax: parseFloat(stateTax.toFixed(2)),
                platformFee: parseFloat(platformFee.toFixed(2)),
                total: parseFloat(total.toFixed(2))
            },
            customer: {
                name: customer?.fullName || 'Unknown',
                email: customer?.email || 'Unknown',
                phone: customer?.phone || 'Unknown'
            },
            restaurant: {
                name: restaurantName,
                address: restaurantAddress.replace(/^, , , $/, 'Address not available'), // Cleanup empty address
                providerId: providerId
            },
            timeline
        };
    }
}

export default new AdminOrderService();

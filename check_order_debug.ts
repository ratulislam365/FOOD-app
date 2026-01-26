
import mongoose from 'mongoose';
import { Order } from './src/models/order.model';
import config from './src/config';

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(config.mongodb.uri as string);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const checkOrder = async (orderId: string) => {
    await connectDB();

    console.log(`Searching for Order: ${orderId}`);
    const order = await Order.findOne({ orderId });

    if (!order) {
        console.log('❌ Order NOT FOUND in database.');
    } else {
        console.log('✅ Order FOUND:');
        console.log(JSON.stringify(order.toJSON(), null, 2));
        console.log('--------------------------------------------------');
        console.log(`Order Provider ID: ${order.providerId.toString()}`);
        console.log('--------------------------------------------------');
        console.log('⚠️  Ensure this matches the Provider ID in your JWT Token.');
    }

    await mongoose.disconnect();
};

// Get Order ID from command line
const idToCheck = process.argv[2];
if (!idToCheck) {
    console.log('Please provide an orderId (e.g., ORD-123...)');
    process.exit(1);
}

checkOrder(idToCheck);

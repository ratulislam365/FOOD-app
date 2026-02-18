/**
 * Seed script to create test data for Admin System
 * Run: ts-node seed-admin-test-data.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserRole, AuthProvider } from './src/models/user.model';
import { ProviderProfile } from './src/models/providerProfile.model';
import { Profile } from './src/models/profile.model';
import { Food } from './src/models/food.model';
import { Order, OrderStatus } from './src/models/order.model';
import { Review } from './src/models/review.model';
import config from './src/config';

async function seedAdminTestData() {
    try {
        console.log('🌱 Starting admin test data seeding...\n');

        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing test data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing test data...');
        await User.deleteMany({ email: { $regex: /@test\.com$/ } });
        console.log('✅ Cleared test users\n');

        // 1. Create Admin User
        console.log('👤 Creating Admin user...');
        const adminPassword = await bcrypt.hash('Admin@123456', 12);
        const admin = await User.create({
            fullName: 'Admin User',
            email: 'admin@fooddelivery.com',
            passwordHash: adminPassword,
            role: UserRole.ADMIN,
            isEmailVerified: true,
            authProvider: AuthProvider.EMAIL,
            isActive: true,
            isSuspended: false,
            roleAssignedAt: new Date(),
            roleAssignedBy: 'system'
        });
        console.log(`✅ Admin created: ${admin.email} (Password: Admin@123456)\n`);

        // 2. Create Test Providers
        console.log('🏪 Creating test providers...');
        const providerPassword = await bcrypt.hash('Provider@123', 12);
        
        const providers = [
            {
                fullName: "Joe's Pizza Restaurant",
                email: 'joe@test.com',
                restaurantName: "Joe's Pizza",
                city: 'New York',
                state: 'NY',
                cuisine: ['Italian', 'Pizza'],
                verificationStatus: 'PENDING',
                location: { lat: 40.7128, lng: -74.0060 }
            },
            {
                fullName: "Maria's Tacos",
                email: 'maria@test.com',
                restaurantName: "Maria's Tacos",
                city: 'Los Angeles',
                state: 'CA',
                cuisine: ['Mexican', 'Tacos'],
                verificationStatus: 'APPROVED',
                location: { lat: 34.0522, lng: -118.2437 }
            },
            {
                fullName: "Sushi Master",
                email: 'sushi@test.com',
                restaurantName: 'Sushi Master',
                city: 'San Francisco',
                state: 'CA',
                cuisine: ['Japanese', 'Sushi'],
                verificationStatus: 'APPROVED',
                location: { lat: 37.7749, lng: -122.4194 }
            },
            {
                fullName: "Burger Palace",
                email: 'burger@test.com',
                restaurantName: 'Burger Palace',
                city: 'Chicago',
                state: 'IL',
                cuisine: ['American', 'Burgers'],
                verificationStatus: 'REJECTED',
                location: { lat: 41.8781, lng: -87.6298 }
            },
            {
                fullName: "Pasta House",
                email: 'pasta@test.com',
                restaurantName: 'Pasta House',
                city: 'Boston',
                state: 'MA',
                cuisine: ['Italian', 'Pasta'],
                verificationStatus: 'APPROVED',
                location: { lat: 42.3601, lng: -71.0589 }
            }
        ];

        const createdProviders = [];
        for (const providerData of providers) {
            const provider = await User.create({
                fullName: providerData.fullName,
                email: providerData.email,
                passwordHash: providerPassword,
                role: UserRole.PROVIDER,
                isEmailVerified: true,
                authProvider: AuthProvider.EMAIL,
                isActive: providerData.verificationStatus === 'APPROVED',
                isSuspended: false,
                roleAssignedAt: new Date(),
                roleAssignedBy: 'system'
            });

            const profile = await ProviderProfile.create({
                providerId: provider._id,
                restaurantName: providerData.restaurantName,
                contactEmail: providerData.email,
                phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                restaurantAddress: `${Math.floor(Math.random() * 999) + 1} Main St`,
                city: providerData.city,
                state: providerData.state,
                zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
                verificationStatus: providerData.verificationStatus as any,
                verificationDocuments: ['https://cloudinary.com/doc1.pdf', 'https://cloudinary.com/doc2.pdf'],
                isVerify: providerData.verificationStatus === 'APPROVED',
                isActive: providerData.verificationStatus === 'APPROVED',
                status: providerData.verificationStatus === 'APPROVED' ? 'ACTIVE' : 'BLOCKED',
                cuisine: providerData.cuisine,
                location: providerData.location,
                pickupWindows: [
                    {
                        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                        startTime: '11:00',
                        endTime: '22:00'
                    }
                ],
                compliance: {
                    alcoholNotice: { enabled: false },
                    tax: { region: 'US-' + providerData.state, rate: 8.5 }
                }
            });

            createdProviders.push({ user: provider, profile });
            console.log(`✅ Provider created: ${provider.email} - ${providerData.restaurantName} (${providerData.verificationStatus})`);
        }
        console.log('');

        // 3. Create Test Customers
        console.log('👥 Creating test customers...');
        const customerPassword = await bcrypt.hash('Customer@123', 12);
        
        const customers = [
            { fullName: 'John Smith', email: 'john@test.com', city: 'New York', state: 'NY' },
            { fullName: 'Jane Doe', email: 'jane@test.com', city: 'Los Angeles', state: 'CA' },
            { fullName: 'Bob Johnson', email: 'bob@test.com', city: 'Chicago', state: 'IL' },
            { fullName: 'Alice Williams', email: 'alice@test.com', city: 'Boston', state: 'MA' },
            { fullName: 'Charlie Brown', email: 'charlie@test.com', city: 'San Francisco', state: 'CA' }
        ];

        const createdCustomers = [];
        for (const customerData of customers) {
            const customer = await User.create({
                fullName: customerData.fullName,
                email: customerData.email,
                passwordHash: customerPassword,
                role: UserRole.CUSTOMER,
                isEmailVerified: true,
                authProvider: AuthProvider.EMAIL,
                isActive: true,
                isSuspended: false,
                roleAssignedAt: new Date(),
                roleAssignedBy: 'system'
            });

            const profile = await Profile.create({
                userId: customer._id,
                name: customerData.fullName,
                phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                address: `${Math.floor(Math.random() * 999) + 1} Oak St`,
                city: customerData.city,
                state: customerData.state,
                profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerData.fullName)}`,
                isVerify: true,
                isActive: true
            });

            createdCustomers.push({ user: customer, profile });
            console.log(`✅ Customer created: ${customer.email} - ${customerData.fullName}`);
        }
        console.log('');

        // 4. Create Food Items for Approved Providers
        console.log('🍔 Creating food items...');
        const approvedProviders = createdProviders.filter(p => p.profile.verificationStatus === 'APPROVED');
        
        const foodItems = [
            { title: 'Margherita Pizza', price: 12.99, category: 'Pizza' },
            { title: 'Pepperoni Pizza', price: 14.99, category: 'Pizza' },
            { title: 'Chicken Tacos', price: 9.99, category: 'Tacos' },
            { title: 'Beef Burrito', price: 11.99, category: 'Mexican' },
            { title: 'California Roll', price: 8.99, category: 'Sushi' },
            { title: 'Salmon Nigiri', price: 10.99, category: 'Sushi' },
            { title: 'Spaghetti Carbonara', price: 13.99, category: 'Pasta' },
            { title: 'Fettuccine Alfredo', price: 12.99, category: 'Pasta' }
        ];

        let totalFoods = 0;
        for (const provider of approvedProviders) {
            const providerFoods = foodItems.slice(0, 4); // Each provider gets 4 items
            for (const foodData of providerFoods) {
                await Food.create({
                    providerId: provider.user._id,
                    title: foodData.title,
                    description: `Delicious ${foodData.title} from ${provider.profile.restaurantName}`,
                    price: foodData.price,
                    category: foodData.category,
                    image: `https://source.unsplash.com/400x300/?${encodeURIComponent(foodData.title)}`,
                    isActive: true,
                    foodStatus: true,
                    serviceFee: 2.99,
                    preparationTime: 20
                });
                totalFoods++;
            }
        }
        console.log(`✅ Created ${totalFoods} food items\n`);

        // 5. Create Sample Orders
        console.log('📦 Creating sample orders...');
        const foods = await Food.find().limit(10);
        let orderCount = 0;

        for (let i = 0; i < 10; i++) {
            const customer = createdCustomers[i % createdCustomers.length];
            const provider = approvedProviders[i % approvedProviders.length];
            const food = foods[i % foods.length];

            const statuses = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            await Order.create({
                orderId: `ORD-${Date.now()}-${i}`,
                customerId: customer.user._id,
                providerId: provider.user._id,
                items: [{
                    foodId: food._id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    price: food.price
                }],
                totalPrice: food.price * (Math.floor(Math.random() * 3) + 1),
                status,
                paymentMethod: 'card',
                deliveryAddress: customer.profile.address,
                platformFee: 3.99,
                pickupTime: new Date(Date.now() + 3600000) // 1 hour from now
            });
            orderCount++;
        }
        console.log(`✅ Created ${orderCount} sample orders\n`);

        // 6. Create Sample Reviews
        console.log('⭐ Creating sample reviews...');
        let reviewCount = 0;

        for (let i = 0; i < 15; i++) {
            const customer = createdCustomers[i % createdCustomers.length];
            const provider = approvedProviders[i % approvedProviders.length];
            const food = foods[i % foods.length];

            await Review.create({
                customerId: customer.user._id,
                providerId: provider.user._id,
                foodId: food._id,
                rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
                comment: 'Great food! Highly recommended.',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
            });
            reviewCount++;
        }
        console.log(`✅ Created ${reviewCount} sample reviews\n`);

        // Summary
        console.log('🎉 Seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - 1 Admin user`);
        console.log(`   - ${createdProviders.length} Providers (${approvedProviders.length} approved)`);
        console.log(`   - ${createdCustomers.length} Customers`);
        console.log(`   - ${totalFoods} Food items`);
        console.log(`   - ${orderCount} Orders`);
        console.log(`   - ${reviewCount} Reviews\n`);

        console.log('🔑 Test Credentials:');
        console.log('   Admin:    admin@fooddelivery.com / Admin@123456');
        console.log('   Provider: joe@test.com / Provider@123');
        console.log('   Customer: john@test.com / Customer@123\n');

        console.log('🚀 You can now test the admin system with Postman!');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the seed function
seedAdminTestData();

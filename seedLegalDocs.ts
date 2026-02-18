import mongoose from 'mongoose';
import { LegalDocument, LegalDocumentStatus } from './src/models/legalDocument.model';
import { User, UserRole } from './src/models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const seedLegalDocs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27000/FOOD-app');
        console.log('Connected to MongoDB');

        // 1. Find or create a system admin for the 'uploadedBy' field
        let admin = await User.findOne({ role: UserRole.ADMIN });
        if (!admin) {
            console.log('No admin found, using a system placeholder ID');
        }
        const adminId = admin ? admin._id.toString() : new mongoose.Types.ObjectId().toString();

        // 2. Sample Data
        const sampleDocs = [
            {
                documentName: 'Terms of Service',
                type: 'PDF',
                size: '1.2 MB',
                fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/legal/tos.pdf',
                status: LegalDocumentStatus.ACTIVE,
                uploadedBy: adminId
            },
            {
                documentName: 'Privacy Policy',
                type: 'DOCX',
                size: '850 KB',
                fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/legal/privacy.docx',
                status: LegalDocumentStatus.ACTIVE,
                uploadedBy: adminId
            },
            {
                documentName: 'Refund Policy (Draft)',
                type: 'PDF',
                size: '450 KB',
                fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/legal/refund_draft.pdf',
                status: LegalDocumentStatus.DRAFT,
                uploadedBy: adminId
            }
        ];

        // 3. Clear existing and Insert
        await LegalDocument.deleteMany({});
        await LegalDocument.insertMany(sampleDocs);

        console.log('✅ Successfully seeded 3 sample legal documents!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding legal documents:', error);
        process.exit(1);
    }
};

seedLegalDocs();

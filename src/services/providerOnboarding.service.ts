import { Types } from 'mongoose';
import { User, UserRole, AuthProvider } from '../models/user.model';
import { ProviderProfile } from '../models/providerProfile.model';
import { ProviderDocument } from '../models/providerDocument.model';
import { Otp, OtpPurpose } from '../models/otp.model';
import {
    generateToken,
    generateRefreshToken,
    hashPassword,
    comparePassword,
    generateOtp,
    hashOtp,
    compareOtp
} from '../utils/authUtils';
import AppError from '../utils/AppError';
import { sendEmail } from '../utils/emailService';
import { getOtpEmailTemplate } from '../utils/emailTemplate';

class ProviderOnboardingService {

    // ──────────────────────────────────────────────────────────
    // STEP 1: Register Email & Send OTP
    // ──────────────────────────────────────────────────────────
    async registerEmail(email: string) {
        console.log(`[ONBOARDING] Registering email: ${email}`);
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            // If already verified with password set, reject
            if (existingUser.isEmailVerified && existingUser.passwordHash) {
                throw new AppError('Email already registered. Please login.', 400);
            }
            // If exists but not verified, resend OTP
        }

        // Create or update user (upsert pattern for retry-safety)
        let user = existingUser;
        if (!user) {
            user = await User.create({
                fullName: normalizedEmail.split('@')[0],
                email: normalizedEmail,
                role: UserRole.PROVIDER,
                isEmailVerified: false,
                authProvider: AuthProvider.EMAIL,
                isProviderApproved: false,
            });
        }

        // Generate & send OTP
        const rawOtp = generateOtp();
        const hashedOtp = hashOtp(rawOtp);

        await Otp.deleteMany({ email: normalizedEmail, purpose: OtpPurpose.EMAIL_VERIFY });

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await Otp.create({
            email: normalizedEmail,
            otp: hashedOtp,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
        });

        await sendEmail({
            email: normalizedEmail,
            subject: 'DineFive - Provider Registration Verification',
            message: `Welcome to DineFive! Your verification code is: ${rawOtp}. This code expires in 10 minutes.`,
            html: getOtpEmailTemplate(rawOtp, user.fullName || normalizedEmail.split('@')[0])
        });

        return {
            message: 'OTP sent to your email',
            data: {
                email: normalizedEmail,
                otpExpiresAt: expiresAt.toISOString(),
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 2: Verify Email OTP
    // ──────────────────────────────────────────────────────────
    async verifyEmailOtp(email: string, otp: string) {
        const normalizedEmail = email.toLowerCase().trim();

        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            purpose: OtpPurpose.EMAIL_VERIFY,
        });

        if (!otpRecord) {
            throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: otpRecord._id });
            throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
        }

        if (!compareOtp(otp.trim(), otpRecord.otp)) {
            throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
        }

        // Mark email as verified
        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            { isEmailVerified: true },
            { new: true }
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Clean up OTPs
        await Otp.deleteMany({ email: normalizedEmail, purpose: OtpPurpose.EMAIL_VERIFY });

        // Temp token for set-password step
        const tempToken = generateToken({ userId: user._id.toString(), role: user.role });

        return {
            message: 'Email verified successfully',
            data: {
                tempToken,
                nextStep: 'set-password',
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 3: Set Password
    // ──────────────────────────────────────────────────────────
    async setPassword(userId: string, password: string, confirmPassword: string) {
        if (password !== confirmPassword) {
            throw new AppError("Passwords don't match", 400);
        }

        const user = await User.findById(userId).select('+passwordHash');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (!user.isEmailVerified) {
            throw new AppError('Please verify your email first', 400);
        }

        if (user.passwordHash) {
            throw new AppError('Password already set. Use change-password instead.', 400);
        }

        const passwordHash = await hashPassword(password);
        user.passwordHash = passwordHash;
        await user.save();

        const accessToken = generateToken({ userId: user._id.toString(), role: user.role });
        const refreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

        return {
            message: 'Password set successfully. Please complete your restaurant profile.',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isVerified: user.isProviderApproved || false,
                },
                nextStep: 'restaurant-info',
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 4: Submit Restaurant Information
    // ──────────────────────────────────────────────────────────
    async submitRestaurantInfo(providerId: string, data: any, restaurantImageUrl?: string) {
        const user = await User.findById(providerId);
        if (!user) throw new AppError('User not found', 404);
        if (user.role !== UserRole.PROVIDER) throw new AppError('Only providers can submit restaurant info', 403);

        // Check for existing profile
        let profile = await ProviderProfile.findOne({ providerId: new Types.ObjectId(providerId) });

        const profileData: any = {
            restaurantName: data.restaurantName,
            contactEmail: data.email || data.contactEmail || user.email,
            phoneNumber: data.PhoneNumebr || data.phoneNumber,
            restaurantAddress: data.RestaurantAddress || data.restaurantAddress,
            city: data.city || 'Pending',
            state: data.state || 'Pending',
            zipCode: data.zipCode || '',
            cuisine: data.cuisine ? (typeof data.cuisine === 'string' ? JSON.parse(data.cuisine) : data.cuisine) : [],
            verificationStatus: 'PENDING',
            isVerify: false,
        };

        if (restaurantImageUrl) {
            profileData.profile = restaurantImageUrl;
        }

        if (profile) {
            // Update existing
            profile = await ProviderProfile.findOneAndUpdate(
                { providerId: new Types.ObjectId(providerId) },
                { $set: profileData },
                { new: true, runValidators: true }
            );
        } else {
            // Create new
            profileData.providerId = new Types.ObjectId(providerId);
            profile = await ProviderProfile.create(profileData);
        }

        return {
            message: 'Restaurant information saved. Please upload required documents.',
            data: {
                profileId: profile!._id,
                restaurantName: profile!.restaurantName,
                restaurantImage: profile!.profile,
                verificationStatus: profile!.verificationStatus,
                nextStep: 'documents-upload',
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 5: Upload Required Documents
    // ──────────────────────────────────────────────────────────
    async uploadDocuments(providerId: string, data: any, files: any) {
        const user = await User.findById(providerId);
        if (!user) throw new AppError('User not found', 404);
        if (user.role !== UserRole.PROVIDER) throw new AppError('Only providers can upload documents', 403);

        // Check that restaurant info is submitted
        const profile = await ProviderProfile.findOne({ providerId: new Types.ObjectId(providerId) });
        if (!profile) {
            throw new AppError('Please submit restaurant information first (Step 4)', 400);
        }

        const docData: any = {
            providerId: new Types.ObjectId(providerId),
            EIN: data.EIN || '',
            businessBankName: data.businessBankName || '',
            businessBankAccountNumber: data.businessBankAccountNumber || '',
            businessBankRoutingNumber: data.businessBankRoutingNumber || '',
            documentStatus: 'pending',
            submittedAt: new Date(),
        };

        // Map uploaded file URLs
        if (files.businessLicenseFile) docData.businessLicense = files.businessLicenseFile[0].path;
        if (files.healthPermitFile) docData.healthPermit = files.healthPermitFile[0].path;
        if (files.stateOrCityLicenseFile) docData.stateOrCityLicense = files.stateOrCityLicenseFile[0].path;
        if (files.proofOfAddressFile) docData.proofOfAddress = files.proofOfAddressFile[0].path;
        if (files.ownerGovernmentID) docData.ownerGovernmentID = files.ownerGovernmentID[0].path;

        // Upsert document record
        let doc = await ProviderDocument.findOne({ providerId: new Types.ObjectId(providerId) });
        if (doc) {
            doc = await ProviderDocument.findOneAndUpdate(
                { providerId: new Types.ObjectId(providerId) },
                { $set: docData },
                { new: true }
            );
        } else {
            doc = await ProviderDocument.create(docData);
        }

        // Update provider profile verification status
        await ProviderProfile.findOneAndUpdate(
            { providerId: new Types.ObjectId(providerId) },
            {
                verificationStatus: 'PENDING',
                isVerify: false // Reset verification on new document upload
            }
        );

        const documentsUploaded: string[] = [];
        if (docData.businessLicense) documentsUploaded.push('businessLicense');
        if (docData.healthPermit) documentsUploaded.push('healthPermit');
        if (docData.stateOrCityLicense) documentsUploaded.push('stateLicense');
        if (docData.proofOfAddress) documentsUploaded.push('proofOfAddress');
        if (docData.ownerGovernmentID) documentsUploaded.push('governmentID');

        return {
            message: 'Documents uploaded successfully. Your application is under review.',
            data: {
                documentStatus: 'pending',
                verificationStatus: 'pending',
                submittedAt: doc!.submittedAt,
                estimatedReviewTime: '24-48 hours',
                documentsUploaded,
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 6A: Admin - Get Pending Providers
    // ──────────────────────────────────────────────────────────
    async getPendingProviders(query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.documentStatus) filter.documentStatus = query.documentStatus;
        else filter.documentStatus = 'pending';

        const [docs, total] = await Promise.all([
            ProviderDocument.find(filter)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({ path: 'providerId', select: 'fullName email phone' })
                .lean(),
            ProviderDocument.countDocuments(filter),
        ]);

        // Enrich with restaurant info
        const providers = await Promise.all(
            docs.map(async (doc: any) => {
                const profile = await ProviderProfile.findOne({ providerId: doc.providerId._id }).lean();
                return {
                    id: doc.providerId._id,
                    ownerName: doc.providerId.fullName,
                    ownerEmail: doc.providerId.email,
                    restaurantName: profile?.restaurantName || 'N/A',
                    phoneNumber: profile?.phoneNumber || doc.providerId.phone || 'N/A',
                    address: profile?.restaurantAddress || 'N/A',
                    documentStatus: doc.documentStatus,
                    submittedAt: doc.submittedAt,
                    documents: {
                        businessLicense: doc.businessLicense || null,
                        EIN: doc.EIN || null,
                        healthPermit: doc.healthPermit || null,
                        stateOrCityLicense: doc.stateOrCityLicense || null,
                        proofOfAddress: doc.proofOfAddress || null,
                        ownerGovernmentID: doc.ownerGovernmentID || null,
                    },
                };
            })
        );

        return {
            providers,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProviders: total,
                hasMore: page * limit < total,
            },
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 6B: Admin - Get Provider Verification Details
    // ──────────────────────────────────────────────────────────
    async getProviderVerificationDetails(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const [user, profile, doc] = await Promise.all([
            User.findById(pId).lean(),
            ProviderProfile.findOne({ providerId: pId }).lean(),
            ProviderDocument.findOne({ providerId: pId }).lean(),
        ]);

        if (!user) throw new AppError('Provider not found', 404);

        return {
            provider: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                isVerified: user.isProviderApproved || false,
                createdAt: user.createdAt,
            },
            restaurant: profile ? {
                restaurantName: profile.restaurantName,
                restaurantImage: profile.profile,
                contactEmail: profile.contactEmail,
                phoneNumber: profile.phoneNumber,
                address: `${profile.restaurantAddress}, ${profile.city}, ${profile.state} ${profile.zipCode}`,
                cuisine: profile.cuisine,
            } : null,
            documents: doc ? {
                businessLicense: { url: doc.businessLicense, uploaded: !!doc.businessLicense },
                EIN: doc.EIN || 'Not provided',
                healthPermit: { url: doc.healthPermit, uploaded: !!doc.healthPermit },
                stateOrCityLicense: { url: doc.stateOrCityLicense, uploaded: !!doc.stateOrCityLicense },
                proofOfAddress: { url: doc.proofOfAddress, uploaded: !!doc.proofOfAddress },
                ownerGovernmentID: { url: doc.ownerGovernmentID, uploaded: !!doc.ownerGovernmentID },
                bankDetails: {
                    bankName: doc.businessBankName,
                    accountNumber: doc.businessBankAccountNumber ? `****${doc.businessBankAccountNumber.slice(-4)}` : 'N/A',
                    routingNumber: doc.businessBankRoutingNumber,
                },
                documentStatus: doc.documentStatus,
                submittedAt: doc.submittedAt,
            } : null,
        };
    }

    // ──────────────────────────────────────────────────────────
    // STEP 6C/D: Admin - Approve or Reject Provider
    // ──────────────────────────────────────────────────────────
    async verifyProvider(providerId: string, adminId: string, action: string, rejectionReason?: string, adminNotes?: string) {
        const pId = new Types.ObjectId(providerId);

        const user = await User.findById(pId);
        if (!user) throw new AppError('Provider not found', 404);
        if (user.role !== UserRole.PROVIDER) throw new AppError('User is not a provider', 400);

        const doc = await ProviderDocument.findOne({ providerId: pId });
        if (!doc) throw new AppError('No documents found for this provider', 400);

        if (action === 'approve') {
            // Approve provider
            user.isProviderApproved = true;
            user.providerApprovedAt = new Date();
            user.providerApprovedBy = adminId;
            await user.save();

            doc.documentStatus = 'approved';
            doc.reviewedBy = new Types.ObjectId(adminId);
            doc.reviewedAt = new Date();
            doc.adminNotes = adminNotes || '';
            await doc.save();

            await ProviderProfile.findOneAndUpdate(
                { providerId: pId },
                { verificationStatus: 'APPROVED', isVerify: true }
            );

            // Send approval email
            await sendEmail({
                email: user.email,
                subject: 'EMDR - Restaurant Approved!',
                message: `Congratulations! Your restaurant has been approved on EMDR. You can now create your menu and go live!`,
            });

            return {
                message: 'Provider approved successfully',
                data: {
                    providerId: user._id,
                    isVerified: true,
                    verificationStatus: 'approved',
                    approvedAt: doc.reviewedAt,
                    approvedBy: adminId,
                },
            };
        } else if (action === 'reject') {
            if (!rejectionReason) throw new AppError('Rejection reason is required', 400);

            user.isProviderApproved = false;
            await user.save();

            doc.documentStatus = 'rejected';
            doc.rejectionReason = rejectionReason;
            doc.reviewedBy = new Types.ObjectId(adminId);
            doc.reviewedAt = new Date();
            doc.adminNotes = adminNotes || '';
            await doc.save();

            await ProviderProfile.findOneAndUpdate(
                { providerId: pId },
                { verificationStatus: 'REJECTED', isVerify: false }
            );

            // Send rejection email
            await sendEmail({
                email: user.email,
                subject: 'EMDR - Application Update',
                message: `Your restaurant application has been reviewed. Unfortunately, we need some corrections: ${rejectionReason}. You can resubmit your documents.`,
            });

            return {
                message: 'Provider rejected',
                data: {
                    providerId: user._id,
                    verificationStatus: 'rejected',
                    rejectionReason,
                    rejectedAt: doc.reviewedAt,
                    rejectedBy: adminId,
                    canResubmit: true,
                },
            };
        } else {
            throw new AppError('Invalid action. Use "approve" or "reject"', 400);
        }
    }

    // ──────────────────────────────────────────────────────────
    // STEP 7: Check Onboarding Status
    // ──────────────────────────────────────────────────────────
    async getOnboardingStatus(providerId: string) {
        const pId = new Types.ObjectId(providerId);

        const [user, profile, doc] = await Promise.all([
            User.findById(pId).lean(),
            ProviderProfile.findOne({ providerId: pId }).lean(),
            ProviderDocument.findOne({ providerId: pId }).lean(),
        ]);

        if (!user) throw new AppError('User not found', 404);

        let currentStep = 'register-email';
        let completedSteps: string[] = [];

        if (user.isEmailVerified) {
            completedSteps.push('email-verified');
            currentStep = 'set-password';
        }
        if (user.passwordHash) {
            completedSteps.push('password-set');
            currentStep = 'restaurant-info';
        }
        if (profile) {
            completedSteps.push('restaurant-info');
            currentStep = 'documents-upload';
        }
        if (doc) {
            completedSteps.push('documents-uploaded');
            currentStep = 'under-review';
        }
        if (doc?.documentStatus === 'approved') {
            completedSteps.push('approved');
            currentStep = 'completed';
        }
        if (doc?.documentStatus === 'rejected') {
            currentStep = 'documents-upload'; // Can resubmit
        }

        return {
            userId: user._id,
            email: user.email,
            currentStep,
            completedSteps,
            isEmailVerified: user.isEmailVerified,
            isProviderApproved: user.isProviderApproved || false,
            verificationStatus: profile?.verificationStatus || 'PENDING',
            documentStatus: doc?.documentStatus || 'not_submitted',
            rejectionReason: doc?.rejectionReason || null,
            canCreateMenu: user.isProviderApproved === true,
            canGoLive: user.isProviderApproved === true,
        };
    }
}

export default new ProviderOnboardingService();

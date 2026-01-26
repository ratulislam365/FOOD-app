import cloudinaryConfig from '../config/cloudinary';
import express, { Request, Response } from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload single image
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary using buffer
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinaryConfig.cloudinary.uploader.upload_stream(
                { folder: 'uploads' },
                (error: any, result: any) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file!.buffer);
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Upload multiple images
// router.post('/upload-multiple', upload.array('images', 10), async (req: Request, res: Response) => {
//     try {
//         if (!req.files || !Array.isArray(req.files)) {
//             return res.status(400).json({ error: 'No files uploaded' });
//         }

//         const uploadPromises = req.files.map((file: any) => {
//             return new Promise((resolve, reject) => {
//                 const uploadStream = cloudinaryConfig.cloudinary.uploader.upload_stream(
//                     { folder: 'uploads' },
//                     (error: any, result: any) => {
//                         if (error) reject(error);
//                         else resolve(result);
//                     }
//                 );
//                 uploadStream.end(file.buffer);
//             });
//         });

//         const results = await Promise.all(uploadPromises);

//         res.json({
//             success: true,
//             data: results
//         });
//     } catch (error) {
//         console.error('Upload error:', error);
//         res.status(500).json({ error: 'Failed to upload images' });
//     }
// });

export default router;
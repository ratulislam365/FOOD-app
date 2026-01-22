"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// Upload single image
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Upload to Cloudinary using buffer
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
// Upload multiple images
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.cloudinary.uploader.upload_stream({ folder: 'uploads' }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                uploadStream.end(file.buffer);
            });
        });
        const results = await Promise.all(uploadPromises);
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});
exports.default = router;

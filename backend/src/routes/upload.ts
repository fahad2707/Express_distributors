import express from 'express';
import multer from 'multer';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { uploadImageBufferToCloudinary } from '../services/cloudinary';
import { assertAllowedImageBuffer } from '../utils/validateImageBuffer';

const router = express.Router();

// Configure multer for memory storage (upload directly to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload image to Cloudinary
router.post('/image', authenticateAdmin, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    assertAllowedImageBuffer(req.file.buffer, req.file.mimetype);
    const uploaded = await uploadImageBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'products',
      'image'
    );

    res.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

export default router;




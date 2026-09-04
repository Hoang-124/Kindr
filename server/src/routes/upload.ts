// server/src/routes/upload.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { uploadImageToCloud } from '../services/cloudinaryService';

const router = Router();

const UploadSchema = z.object({
  image: z.string().min(1, 'Dữ liệu ảnh không được để trống'),
  folder: z.string().optional(),
});

/**
 * POST /api/upload
 * Upload an image (base64 or URL) to Cloudinary Media Cloud CDN.
 * Protected route: requires JWT Bearer token.
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = UploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { image, folder = 'kindr/products' } = parsed.data;

    const result = await uploadImageToCloud(image, folder);
    if (!result.success) {
      res.status(500).json({ error: result.error || 'Tải ảnh lên đám mây thất bại.' });
      return;
    }

    res.status(201).json({
      message: 'Tải ảnh lên đám mây Cloudinary thành công! ☁️',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tải ảnh lên đám mây.' });
  }
});

export default router;

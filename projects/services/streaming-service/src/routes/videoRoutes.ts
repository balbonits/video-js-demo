import { Router } from 'express';
import multer from 'multer';
import { videoController } from '../controllers/videoController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { config } from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads',
  limits: {
    fileSize: config.streaming.maxUploadSize,
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext && config.streaming.supportedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${ext}`));
    }
  },
});

// Upload video
router.post(
  '/upload',
  authMiddleware,
  upload.single('video'),
  videoController.uploadVideo
);

// Get video metadata
router.get(
  '/:id/metadata',
  authMiddleware,
  videoController.getVideoMetadata
);

// Start transcoding job
router.post(
  '/:id/transcode',
  authMiddleware,
  validateRequest,
  videoController.startTranscoding
);

// Get video thumbnails
router.get(
  '/:id/thumbnails',
  authMiddleware,
  videoController.getThumbnails
);

// Get video preview
router.get(
  '/:id/preview',
  authMiddleware,
  videoController.getPreview
);

// Delete video
router.delete(
  '/:id',
  authMiddleware,
  videoController.deleteVideo
);

export const videoRoutes = router;
import { Router } from 'express';
import { jobController } from '../controllers/jobController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get job status
router.get('/:id', authMiddleware, jobController.getJobStatus);

// Get queue metrics
router.get('/metrics', authMiddleware, jobController.getQueueMetrics);

// Cancel job
router.delete('/:id', authMiddleware, jobController.cancelJob);

// Retry failed job
router.post('/:id/retry', authMiddleware, jobController.retryJob);

export const jobRoutes = router;
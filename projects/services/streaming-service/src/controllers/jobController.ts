import { Request, Response, NextFunction } from 'express';
import { getJobStatus as getQueueJobStatus, getQueueMetrics as getMetrics } from '../services/queueService';
import { logger } from '../utils/logger';

class JobController {
  async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const job = await getQueueJobStatus(id);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(job);
    } catch (error) {
      logger.error('Failed to get job status:', error);
      next(error);
    }
  }

  async getQueueMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get queue metrics:', error);
      next(error);
    }
  }

  async cancelJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // TODO: Implement job cancellation
      res.json({ message: 'Job cancellation not yet implemented' });
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      next(error);
    }
  }

  async retryJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // TODO: Implement job retry
      res.json({ message: 'Job retry not yet implemented' });
    } catch (error) {
      logger.error('Failed to retry job:', error);
      next(error);
    }
  }
}

export const jobController = new JobController();
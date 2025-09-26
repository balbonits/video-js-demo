import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const schemas = {
  transcode: Joi.object({
    profiles: Joi.array().items(
      Joi.string().valid('360p', '480p', '720p', '1080p', '4k')
    ).default(['720p', '480p']),
    generateHLS: Joi.boolean().default(true),
    generateDASH: Joi.boolean().default(false),
    generateThumbnails: Joi.boolean().default(true),
  }),

  upload: Joi.object({
    title: Joi.string().max(255),
    description: Joi.string().max(1000),
    tags: Joi.array().items(Joi.string()),
    public: Joi.boolean().default(false),
  }),
};

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const schemaName = req.route.path.includes('transcode') ? 'transcode' : 'upload';
  const schema = schemas[schemaName as keyof typeof schemas];

  if (!schema) {
    return next();
  }

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  req.body = value;
  next();
}
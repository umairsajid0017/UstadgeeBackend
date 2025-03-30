import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return validationError(res, error);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

export const validationError = (res: Response, error: ZodError) => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors
  });
};

// Service validation
export const serviceValidator = z.object({
  title: z.string().min(3).max(100).trim(),
  description: z.string().min(10).max(1000).trim(),
  charges: z.number().int().min(0),
  category_id: z.number().int().positive(),
  user_id: z.string().min(1)
});

// Task validation
export const taskValidator = z.object({
  service_id: z.number().int().positive(),
  user_id: z.string().min(1),
  worker_id: z.string().min(1),
  description: z.string().min(5).max(500).trim(),
  est_time: z.number().int().min(1),
  total_amount: z.number().int().min(1),
  offer_expiration_date: z.string().min(1),
  cnic: z.string().min(1),
  arrival_time: z.string().min(1)
});

// Review validation
export const reviewValidator = z.object({
  worker_id: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  description: z.string().min(1).max(255).trim(),
  user_id: z.number().int().positive()
});

// Location update validation
export const locationValidator = z.object({
  worker_id: z.string().min(1),
  lat: z.string().min(1),
  lng: z.string().min(1)
});

// Service boosting validation
export const serviceBoostValidator = z.object({
  service_id: z.number().int().positive(),
  day_selected: z.number().int().positive(),
  payment_method: z.string().min(1),
  amount: z.number().int().positive()
});

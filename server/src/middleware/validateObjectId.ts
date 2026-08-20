// server/src/middleware/validateObjectId.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Middleware to validate Mongoose ObjectId in route params.
 * Prevents CastError exceptions that cause 500 crashes.
 */
export function validateObjectId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: `Định dạng ${paramName} không hợp lệ.` });
      return;
    }

    next();
  };
}

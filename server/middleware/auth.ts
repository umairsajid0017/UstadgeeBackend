import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ustadgee_app_secret_key_for_security';

// Add custom type to Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        phoneNumber: string;
        userTypeId: number;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user exists with this token
    const user = await prisma.users.findFirst({
      where: {
        id: decoded.id,
        token: {
          contains: token
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      phoneNumber: user.phone_number,
      userTypeId: user.user_type
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Service provider check middleware
export const isServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userTypeId === 1) { // Assuming 1 is service provider type
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Service provider role required' });
  }
};

// Regular user check middleware
export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userTypeId === 2) { // Assuming 2 is regular user type
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. User role required' });
  }
};

// Admin check middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.userTypeId === 3) { // Assuming 3 is admin type
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin role required' });
  }
};
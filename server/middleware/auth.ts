import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'ustadgee-secret-key';

// Extend Express Request type to include user property
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

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      phoneNumber: string;
      userTypeId: number;
    };
    
    // Check if user exists with the token
    const user = await db.select()
      .from(users)
      .where(
        and(
          eq(users.id, decoded.id),
          eq(users.token, token)
        )
      )
      .limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Set user in request
    req.user = {
      id: decoded.id,
      phoneNumber: decoded.phoneNumber,
      userTypeId: decoded.userTypeId
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user is a service provider (Ustadgee or Karigar)
export const isServiceProvider = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  // Check if user type is 2 (Ustadgee) or 3 (Karigar)
  if (req.user.userTypeId !== 2 && req.user.userTypeId !== 3) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only service providers can perform this action.'
    });
  }
  
  next();
};

// Check if user is a normal user (not a service provider)
export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  // Check if user type is 1 (User)
  if (req.user.userTypeId !== 1) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only regular users can perform this action.'
    });
  }
  
  next();
};

// Check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  // In a real system, you'd check against admin table
  // For now, we'll use a simple check
  if (req.user.userTypeId !== 999) { // Assuming 999 is admin type
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users, User, InsertUser, registerUserSchema, loginUserSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { validationError } from './middleware/validation';
import { saveProfileImage } from './utils/helpers';

const JWT_SECRET = process.env.JWT_SECRET || 'ustadgee-secret-key';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    phoneNumber: user.phoneNumber,
    userTypeId: user.userTypeId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = await registerUserSchema.safeParseAsync(req.body);
    
    if (!validation.success) {
      return validationError(res, validation.error);
    }
    
    const { phoneNumber, fullName, password, userTypeId, imageData, imageName } = validation.data;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Process profile image if available
    let profileImage = '';
    if (imageData && imageName) {
      profileImage = await saveProfileImage(imageData, imageName);
    }
    
    // Create new user
    const newUser: InsertUser = {
      phoneNumber,
      fullName,
      password: hashedPassword,
      profileImage: profileImage || 'default-profile.png',
      auth: '',
      active: 1,
      userTypeId,
      latitude: req.body.latitude || '0',
      longitude: req.body.longitude || '0',
      cnicFrontImg: req.body.cnicFrontImg || '',
      cnicBackImg: req.body.cnicBackImg || '',
      cnicNum: req.body.cnicNum || '',
      createdAt: new Date()
    };
    
    // Insert user
    const [insertedUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      phoneNumber: users.phoneNumber,
      fullName: users.fullName,
      userTypeId: users.userTypeId
    });
    
    // Generate JWT token
    const token = generateToken(insertedUser as User);
    
    // Update user token
    await db.update(users)
      .set({ token })
      .where(eq(users.id, insertedUser.id));
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id: insertedUser.id,
        phone_number: insertedUser.phoneNumber,
        full_name: insertedUser.fullName,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    // Get phone and password from request body
    const { phoneNumber, password } = req.body;
    
    // Find user by phone number
    const [existingUser] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePasswords(password, existingUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken(existingUser);
    
    // Update user token
    await db.update(users)
      .set({ token })
      .where(eq(users.id, existingUser.id));
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: existingUser.id,
          phone_number: existingUser.phoneNumber,
          full_name: existingUser.fullName,
          user_type: existingUser.userTypeId
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
}

export async function checkUserExists(req: Request, res: Response) {
  try {
    const phone = req.body.phone;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Find user by phone number
    const existingUser = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
    
    return res.status(200).json({
      success: true,
      exists: existingUser.length > 0
    });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Find user by ID
    const [user] = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      fullName: users.fullName,
      profileImage: users.profileImage,
      userTypeId: users.userTypeId,
      latitude: users.latitude,
      longitude: users.longitude
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

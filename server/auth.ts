import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './db';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ustadgee_app_secret_key_for_security';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Compare password with hash
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: any): string {
  return jwt.sign(
    { id: user.id, phoneNumber: user.phone_number, userTypeId: user.user_type },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Generate a unique referral code
function generateReferralCode(length = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Register new user
export async function register(req: Request, res: Response) {
  try {
    const { 
      phoneNumber, 
      fullName, 
      password, 
      userTypeId, 
      imageData, 
      image_name,
      referralCode, 
      notificationPermission,
      deviceToken 
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { phone_number: phoneNumber }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Find referrer if referral code provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.users.findFirst({
        where: { 
          referral_code: {
            equals: referralCode
          }
        }
      });
      
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate a unique referral code for this user if user type is Ustad (2)
    const newReferralCode = userTypeId === 2 ? generateReferralCode() : null;

    // Create the user in database
    const newUser = await prisma.users.create({
      data: {
        phone_number: phoneNumber,
        full_name: fullName,
        password: hashedPassword,
        user_type: userTypeId,
        profile_image: image_name || 'default.png',
        auth: 'local',
        active: 1,
        referral_code: newReferralCode,
        referred_by: referrerId,
        notification_permission: notificationPermission || 'default',
        device_token: deviceToken,
        latitude: '0',
        longitude: '0',
        cnic_front_img: '',
        cnic_back_img: '',
        cnic_num: ''
      }
    });

    // Generate JWT token
    const token = generateToken(newUser);

    // Update user with token
    await prisma.users.update({
      where: { id: newUser.id },
      data: { token }
    });

    // Response with user and token
    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        phoneNumber: newUser.phone_number,
        fullName: newUser.full_name,
        userTypeId: newUser.user_type,
        profileImage: newUser.profile_image,
        referralCode: newUser.referral_code || null,
        notificationPermission: newUser.notification_permission || 'default'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Login user
export async function login(req: Request, res: Response) {
  try {
    const { phoneNumber, password } = req.body;

    // Check user exists
    const user = await prisma.users.findUnique({
      where: { phone_number: phoneNumber }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Update user with new token
    await prisma.users.update({
      where: { id: user.id },
      data: { token }
    });

    // Response with user and token
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        fullName: user.full_name,
        userTypeId: user.user_type,
        profileImage: user.profile_image,
        referralCode: user.referral_code,
        notificationPermission: user.notification_permission || 'default'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Check if user exists
export async function checkUserExists(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;
    
    const user = await prisma.users.findUnique({
      where: { phone_number: phoneNumber }
    });
    
    if (user) {
      return res.json({ success: true, exists: true });
    } else {
      return res.json({ success: true, exists: false });
    }
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get authenticated user
export async function getUser(req: Request, res: Response) {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        fullName: user.full_name,
        userTypeId: user.user_type,
        profileImage: user.profile_image,
        referralCode: user.referral_code,
        notificationPermission: user.notification_permission || 'default'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
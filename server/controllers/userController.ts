import { Request, Response } from 'express';
import { db } from '../db';
import { users, User } from '../../shared/schema';
import { eq, like } from 'drizzle-orm';
import { formatPhoneNumber } from '../utils/helpers';

export async function updateUserLocation(req: Request, res: Response) {
  try {
    const { worker_id, lat, lng } = req.body;
    
    if (!worker_id || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID, latitude, and longitude are required'
      });
    }
    
    // Update user's location
    await db.update(users)
      .set({
        latitude: lat,
        longitude: lng
      })
      .where(eq(users.id, parseInt(worker_id, 10)));
    
    return res.status(200).json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating location'
    });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const userId = req.params.id || req.user?.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get user profile
    const [userProfile] = await db.select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      fullName: users.fullName,
      profileImage: users.profileImage,
      userTypeId: users.userTypeId,
      latitude: users.latitude,
      longitude: users.longitude,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, parseInt(userId.toString(), 10)))
    .limit(1);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
}

export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const allowedFields = ['fullName', 'cnicNum'];
    const updateData: Partial<User> = {};
    
    // Filter only allowed fields
    for (const field of allowedFields) {
      if (req.body[field]) {
        updateData[field as keyof Partial<User>] = req.body[field];
      }
    }
    
    // Handle profile image separately
    if (req.file && 'filename' in req.file) {
      updateData.profileImage = req.file.filename;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update user profile
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
}

export async function searchUsers(req: Request, res: Response) {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search users by name or phone number
    const searchResults = await db.select({
      id: users.id,
      fullName: users.fullName,
      phoneNumber: users.phoneNumber,
      profileImage: users.profileImage,
      userTypeId: users.userTypeId
    })
    .from(users)
    .where(
      like(users.fullName, `%${query}%`)
    )
    .limit(20);
    
    return res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
}

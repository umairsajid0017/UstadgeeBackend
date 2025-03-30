import { Request, Response } from 'express';
import { db } from '../db';
import { notifications, users, InsertNotification } from '../../shared/schema';
import { eq, desc, and, asc } from 'drizzle-orm';

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;
    
    // Get notifications for the user
    const userNotifications = await db.select({
      id: notifications.id,
      title: notifications.title,
      type: notifications.type,
      timeStamp: notifications.timeStamp,
      usernameNotifier: notifications.usernameNotifier,
      postId: notifications.postId,
      isRead: notifications.isRead
    })
    .from(notifications)
    .where(eq(notifications.username, userId.toString()))
    .orderBy(desc(notifications.timeStamp))
    .limit(limit)
    .offset(offset);
    
    // Get user details for notifiers
    const notifierIds = [...new Set(userNotifications.map(
      notification => parseInt(notification.usernameNotifier, 10)
    ))];
    
    if (notifierIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }
    
    const notifiers = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(eq(users.id, notifierIds));
    
    const notifiersById = notifiers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, typeof notifiers[number]>);
    
    // Get total count
    const [{ count }] = await db.select({
      count: db.fn.count(notifications.id)
    })
    .from(notifications)
    .where(eq(notifications.username, userId.toString()));
    
    // Combine notification data with user data
    const notificationsWithUserData = userNotifications.map(notification => ({
      ...notification,
      notifier: notifiersById[parseInt(notification.usernameNotifier, 10)] || null
    }));
    
    return res.status(200).json({
      success: true,
      data: notificationsWithUserData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
}

export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const notificationId = parseInt(req.params.id, 10);
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required'
      });
    }
    
    // Check if notification exists and belongs to the user
    const [notification] = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.username, userId.toString())
        )
      )
      .limit(1);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or does not belong to you'
      });
    }
    
    // Mark notification as read
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, notificationId));
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notification'
    });
  }
}

export async function markAllNotificationsAsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Mark all notifications as read
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.username, userId.toString()));
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notifications'
    });
  }
}

export async function createNotification(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { title, type, username, post_id } = req.body;
    
    if (!title || type === undefined || !username || !post_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, username, and post_id are required'
      });
    }
    
    // Check if recipient user exists
    const [recipientUser] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(username, 10)))
      .limit(1);
    
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }
    
    // Create notification
    const newNotification: InsertNotification = {
      title,
      type: parseInt(type, 10),
      username: username.toString(),
      usernameNotifier: userId.toString(),
      postId: parseInt(post_id, 10),
      isRead: 0
    };
    
    const [insertedNotification] = await db.insert(notifications)
      .values(newNotification)
      .returning({ id: notifications.id });
    
    return res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { id: insertedNotification.id }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating notification'
    });
  }
}

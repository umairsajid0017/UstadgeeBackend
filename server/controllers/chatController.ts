import { Request, Response } from 'express';
import { db } from '../db';
import { chatList, users, InsertChat } from '../../shared/schema';
import { eq, and, or, desc, gte } from 'drizzle-orm';

export async function getChatList(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const userIdStr = userId.toString();
    
    // Get chat list for the user
    const chats = await db.select({
      id: chatList.id,
      user1: chatList.user1,
      user2: chatList.user2,
      timeStamp: chatList.timeStamp,
      lastMsg: chatList.lastMsg,
      type: chatList.type
    })
    .from(chatList)
    .where(
      and(
        or(
          eq(chatList.user1, userIdStr),
          eq(chatList.user2, userIdStr)
        ),
        or(
          eq(chatList.deletedBy, ''),
          gte(chatList.deletedBy, userIdStr) // Not deleted by current user
        )
      )
    )
    .orderBy(desc(chatList.timeStamp));
    
    // Get user details for each chat
    const otherUserIds = chats.map(chat => 
      chat.user1 === userIdStr ? parseInt(chat.user2, 10) : parseInt(chat.user1, 10)
    );
    
    // No chats found
    if (otherUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const otherUsers = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage,
      phoneNumber: users.phoneNumber
    })
    .from(users)
    .where(eq(users.id, otherUserIds));
    
    const userMap = otherUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, typeof otherUsers[number]>);
    
    // Combine chat data with user data
    const chatsWithUserData = chats.map(chat => {
      const otherUserId = chat.user1 === userIdStr ? parseInt(chat.user2, 10) : parseInt(chat.user1, 10);
      return {
        ...chat,
        otherUser: userMap[otherUserId] || null
      };
    });
    
    return res.status(200).json({
      success: true,
      data: chatsWithUserData
    });
  } catch (error) {
    console.error('Error fetching chat list:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching chat list'
    });
  }
}

export async function startChat(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { recipient_id, message } = req.body;
    
    if (!recipient_id) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }
    
    const userIdStr = userId.toString();
    const recipientIdStr = recipient_id.toString();
    
    // Check if chat already exists
    const existingChat = await db.select()
      .from(chatList)
      .where(
        or(
          and(
            eq(chatList.user1, userIdStr),
            eq(chatList.user2, recipientIdStr)
          ),
          and(
            eq(chatList.user1, recipientIdStr),
            eq(chatList.user2, userIdStr)
          )
        )
      )
      .limit(1);
    
    if (existingChat.length > 0) {
      // Update existing chat
      await db.update(chatList)
        .set({
          lastMsg: message || '',
          type: 'text',
          deletedBy: '', // Reset deleted status
          timeStamp: new Date()
        })
        .where(eq(chatList.id, existingChat[0].id));
      
      return res.status(200).json({
        success: true,
        message: 'Chat updated successfully',
        data: { chat_id: existingChat[0].id }
      });
    }
    
    // Create new chat
    const newChat: InsertChat = {
      user1: userIdStr,
      user2: recipientIdStr,
      lastMsg: message || '',
      type: 'text',
      deletedBy: ''
    };
    
    const [insertedChat] = await db.insert(chatList)
      .values(newChat)
      .returning({ id: chatList.id });
    
    return res.status(201).json({
      success: true,
      message: 'Chat started successfully',
      data: { chat_id: insertedChat.id }
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while starting chat'
    });
  }
}

export async function updateChatMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { chat_id, message, type } = req.body;
    
    if (!chat_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message are required'
      });
    }
    
    const userIdStr = userId.toString();
    
    // Check if chat exists and user is a participant
    const [existingChat] = await db.select()
      .from(chatList)
      .where(
        and(
          eq(chatList.id, parseInt(chat_id, 10)),
          or(
            eq(chatList.user1, userIdStr),
            eq(chatList.user2, userIdStr)
          )
        )
      )
      .limit(1);
    
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or you are not a participant'
      });
    }
    
    // Update chat message
    await db.update(chatList)
      .set({
        lastMsg: message,
        type: type || 'text',
        timeStamp: new Date()
      })
      .where(eq(chatList.id, parseInt(chat_id, 10)));
    
    return res.status(200).json({
      success: true,
      message: 'Chat message updated successfully'
    });
  } catch (error) {
    console.error('Error updating chat message:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating chat message'
    });
  }
}

export async function deleteChat(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const chatId = parseInt(req.params.id, 10);
    
    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required'
      });
    }
    
    const userIdStr = userId.toString();
    
    // Check if chat exists and user is a participant
    const [existingChat] = await db.select()
      .from(chatList)
      .where(
        and(
          eq(chatList.id, chatId),
          or(
            eq(chatList.user1, userIdStr),
            eq(chatList.user2, userIdStr)
          )
        )
      )
      .limit(1);
    
    if (!existingChat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or you are not a participant'
      });
    }
    
    // Soft delete chat for the user
    // If deletedBy is empty, set to current user
    // If deletedBy is the other user, hard delete the chat
    if (existingChat.deletedBy === '') {
      await db.update(chatList)
        .set({ deletedBy: userIdStr })
        .where(eq(chatList.id, chatId));
    } else {
      // The other user has already deleted, so hard delete
      await db.delete(chatList)
        .where(eq(chatList.id, chatId));
    }
    
    return res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting chat'
    });
  }
}

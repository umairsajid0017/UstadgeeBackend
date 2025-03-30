import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from 'path';
import multer from 'multer';
import { promises as fsPromises } from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

// Auth middleware
import { authenticate, isServiceProvider, isUser, isAdmin } from "./middleware/auth";

// Auth controller
import { register, login, checkUserExists, getUser } from "./auth";

// Service controller
import { 
  addService, 
  updateService,
  deleteService,
  getServices,
  getServiceById,
  searchUstadgee,
  boostService,
  getCategories,
  getSubCategories
} from './controllers/serviceController';

// Task controller
import { 
  addTask, 
  getUstadRequests, 
  getUserRequests, 
  getUserRequestsCompleted, 
  updateRequestStatus 
} from './controllers/taskController';

// Chat controller
import {
  getChatList,
  startChat,
  updateChatMessage,
  deleteChat
} from './controllers/chatController';

// Notification controller
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification
} from './controllers/notificationController';

// User controller
import {
  updateUserLocation,
  getUserProfile,
  updateUserProfile,
  searchUsers
} from './controllers/userController';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const profileUploadDir = path.join(process.cwd(), 'uploads', 'profiles');
  const serviceUploadDir = path.join(process.cwd(), 'uploads', 'services');
  const audioUploadDir = path.join(process.cwd(), 'uploads', 'audio');

  // Create upload directories
  try {
    await fsPromises.mkdir(profileUploadDir, { recursive: true });
    await fsPromises.mkdir(serviceUploadDir, { recursive: true });
    await fsPromises.mkdir(audioUploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }

  // Configure multer storages
  const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, profileUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, serviceUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, audioUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  // Create multer instances
  const uploadProfileImage = multer({ storage: profileStorage });
  const uploadServiceImage = multer({ storage: serviceStorage });
  const uploadAudio = multer({ storage: audioStorage });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Authentication routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/checkUserExists", checkUserExists);
  app.get("/api/user", authenticate, getUser);

  // Service routes
  app.get("/api/services", getServices);
  app.get("/api/service/:id", getServiceById);
  app.post("/api/addService", authenticate, isServiceProvider, addService);
  app.put("/api/service/:id", authenticate, isServiceProvider, updateService);
  app.delete("/api/service/:id", authenticate, isServiceProvider, deleteService);
  app.post("/api/searchUstadgee", searchUstadgee);
  app.post("/api/boostService", authenticate, isServiceProvider, boostService);
  app.get("/api/categories", getCategories);
  app.get("/api/subCategories/:category_id", getSubCategories);

  // Task routes
  app.post("/api/addTask", authenticate, isUser, addTask);
  app.post("/api/getUstadRequests", authenticate, isServiceProvider, getUstadRequests);
  app.post("/api/getUserRequests", authenticate, isUser, getUserRequests);
  app.post("/api/getUserRequestsCompleted", authenticate, isUser, getUserRequestsCompleted);
  app.post("/api/updateRequestStatus", authenticate, updateRequestStatus);
  
  // Chat routes
  app.get("/api/chats", authenticate, getChatList);
  app.post("/api/startChat", authenticate, startChat);
  app.put("/api/chat/:id", authenticate, updateChatMessage);
  app.delete("/api/chat/:id", authenticate, deleteChat);
  
  // Notification routes
  app.get("/api/notifications", authenticate, getNotifications);
  app.put("/api/notification/:id", authenticate, markNotificationAsRead);
  app.put("/api/notifications/markAllRead", authenticate, markAllNotificationsAsRead);
  app.post("/api/notification", authenticate, createNotification);
  
  // User profile routes
  app.get("/api/profile", authenticate, getUserProfile);
  app.put("/api/profile", authenticate, uploadProfileImage.single('profileImage'), updateUserProfile);
  app.put("/api/location", authenticate, updateUserLocation);
  app.get("/api/search/users", authenticate, searchUsers);

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Client connections map to track user connections
  const clients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication on connection
        if (data.type === 'auth') {
          userId = parseInt(data.userId);
          
          // Store the connection
          if (!clients.has(userId)) {
            clients.set(userId, []);
          }
          clients.get(userId)?.push(ws);
          
          console.log(`User ${userId} authenticated via WebSocket`);
          // Send confirmation
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            message: 'Authentication successful' 
          }));
        }
        
        // Handle chat messages
        else if (data.type === 'chat') {
          const { recipientId, message: chatMessage, senderId } = data;
          
          // Forward message to recipient if online
          if (clients.has(recipientId)) {
            clients.get(recipientId)?.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat',
                  senderId,
                  message: chatMessage,
                  timestamp: new Date().toISOString()
                }));
              }
            });
          }
          
          // Store message in database (handled by the chat controller)
          // This would be an HTTP request or direct DB call
        }
        
        // Handle notification permission request
        else if (data.type === 'notification_permission') {
          if (userId) {
            // Update user's notification permission in database
            // For now, just acknowledge
            ws.send(JSON.stringify({
              type: 'notification_permission_update',
              status: 'success'
            }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Remove client from connections
      if (userId && clients.has(userId)) {
        const userConnections = clients.get(userId) || [];
        const index = userConnections.indexOf(ws);
        if (index !== -1) {
          userConnections.splice(index, 1);
        }
        
        // Clean up empty user entries
        if (userConnections.length === 0) {
          clients.delete(userId);
        }
      }
    });
  });
  
  // Export broadcast function to send notifications to users
  (global as any).sendNotification = (userId: number, notification: any) => {
    if (clients.has(userId)) {
      clients.get(userId)?.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'notification',
            ...notification
          }));
        }
      });
    }
  };
  
  return httpServer;
}

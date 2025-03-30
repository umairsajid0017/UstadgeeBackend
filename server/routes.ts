import type { Express } from "express";
import { createServer, type Server } from "http";
import { db, initializeDatabase } from "./db";
import { authenticate, isServiceProvider, isUser } from "./middleware/auth";
import { processBase64Image, processBase64Audio, uploadProfileImage, uploadServiceImages, uploadAudio } from "./middleware/upload";
import { validate } from "./middleware/validation";
import { registerUserSchema, loginUserSchema } from "../shared/schema";

// Controllers
import * as authController from "./auth";
import * as userController from "./controllers/userController";
import * as serviceController from "./controllers/serviceController";
import * as taskController from "./controllers/taskController";
import * as reviewController from "./controllers/reviewController";
import * as chatController from "./controllers/chatController";
import * as notificationController from "./controllers/notificationController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database
  await initializeDatabase();

  // Auth Routes
  app.post("/api/register", processBase64Image, validate(registerUserSchema), authController.register);
  app.post("/api/login", validate(loginUserSchema), authController.login);
  app.post("/api/checkUserExists", authController.checkUserExists);
  app.get("/api/user", authenticate, authController.getUser);

  // User Routes
  app.post("/api/updateUserLocation", authenticate, userController.updateUserLocation);
  app.get("/api/userProfile/:id?", authenticate, userController.getUserProfile);
  app.put("/api/userProfile", authenticate, uploadProfileImage, userController.updateUserProfile);
  app.get("/api/searchUsers", authenticate, userController.searchUsers);

  // Service Routes
  app.get("/api/services", serviceController.getServices);
  app.get("/api/service/:id", serviceController.getServiceById);
  app.post("/api/addService", authenticate, isServiceProvider, uploadServiceImages, serviceController.addService);
  app.put("/api/service/:id", authenticate, isServiceProvider, uploadServiceImages, serviceController.updateService);
  app.delete("/api/service/:id", authenticate, isServiceProvider, serviceController.deleteService);
  app.post("/api/searchUstadgee", serviceController.searchUstadgee);
  app.post("/api/boostService", authenticate, isServiceProvider, serviceController.boostService);
  app.get("/api/categories", serviceController.getCategories);
  app.get("/api/subCategories", serviceController.getSubCategories);

  // Task Routes
  app.post("/api/addTask", authenticate, processBase64Audio, taskController.addTask);
  app.post("/api/getUstadRequests", authenticate, taskController.getUstadRequests);
  app.post("/api/getUserRequests", authenticate, taskController.getUserRequests);
  app.post("/api/getUserRequestsCompleted", authenticate, taskController.getUserRequestsCompleted);
  app.post("/api/updateRequestStatus", authenticate, taskController.updateRequestStatus);

  // Review Routes
  app.post("/api/addReview", authenticate, reviewController.addReview);
  app.post("/api/showReviews", reviewController.showReviews);
  app.get("/api/reviews/:worker_id", reviewController.showReviews);

  // Chat Routes
  app.get("/api/chats", authenticate, chatController.getChatList);
  app.post("/api/startChat", authenticate, chatController.startChat);
  app.put("/api/updateChatMessage", authenticate, chatController.updateChatMessage);
  app.delete("/api/chat/:id", authenticate, chatController.deleteChat);

  // Notification Routes
  app.get("/api/notifications", authenticate, notificationController.getNotifications);
  app.put("/api/notification/:id/read", authenticate, notificationController.markNotificationAsRead);
  app.put("/api/notifications/read-all", authenticate, notificationController.markAllNotificationsAsRead);
  app.post("/api/notification", authenticate, notificationController.createNotification);

  const httpServer = createServer(app);
  
  return httpServer;
}

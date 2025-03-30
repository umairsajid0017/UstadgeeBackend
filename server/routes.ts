import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from 'path';
import multer from 'multer';
import { promises as fsPromises } from 'fs';

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

  const httpServer = createServer(app);
  
  return httpServer;
}

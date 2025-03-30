import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Create Prisma client
const prisma = new PrismaClient();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 100)}`;
        if (JSON.stringify(capturedJsonResponse).length > 100) {
          logLine += "...";
        }
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Register API routes - connects all our controllers
    const server = await registerRoutes(app);

    // Global error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        success: false, 
        message, 
        error: app.get("env") === "development" ? err.stack : undefined 
      });
    });

    // Setup vite for development or serve static files for production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server on port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running at http://localhost:${port}`);
      log(`API is available at http://localhost:${port}/api`);
      log(`Frontend is available at http://localhost:${port}`);
    });

    // Close Prisma on shutdown
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

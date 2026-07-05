import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import routes from './routes';
import { socketService } from './services/SocketService';
import { logger, httpLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { swaggerDocument } from './swagger';

// Load Environment variables
dotenv.config({ path: path.join(__dirname, '../.env') }); // server/.env
dotenv.config({ path: path.join(__dirname, '../../.env') }); // root .env

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading local uploads from frontend
}));
app.use(cors({
  origin: '*', // Allow all origins in dev, customize for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Express limits
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging using Pino HTTP
app.use(httpLogger);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again later.' }
  }
});
app.use('/api', limiter);

// Serve uploads folder statically for attachments fallback
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Swagger UI Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Modular Routes API v1
app.use('/api/v1', routes);

// Base Route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'AI Task Manager MERN API is running. Docs available at /api/v1/docs',
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

// Initialize WebSocket Service
socketService.initialize(httpServer);

// Connect Database & Start Server
const startServer = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-task-manager';
  logger.info('Connecting to MongoDB...');

  try {
    await mongoose.connect(uri);
    logger.info('MongoDB Connected');

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (error: any) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

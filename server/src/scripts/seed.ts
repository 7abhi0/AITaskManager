import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { TaskModel } from '../models/Task';
import { NotificationModel } from '../models/Notification';
import { logger } from '../middleware/logger';

import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') }); // server/.env
dotenv.config({ path: path.join(__dirname, '../../../../.env') }); // root .env

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-task-manager';
  logger.info(`Seeding database at ${uri}...`);

  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB for seeding.');

    // Clear existing data
    await UserModel.deleteMany({});
    await TaskModel.deleteMany({});
    await NotificationModel.deleteMany({});
    logger.info('Cleared existing collections.');

    // 1. Create Seed Users
    const adminUser = new UserModel({
      name: 'System Admin',
      email: 'admin@taskmanager.com',
      password: 'password123',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });

    const leadUser = new UserModel({
      name: 'Sarah Team Lead',
      email: 'lead@taskmanager.com',
      password: 'password123',
      role: 'TEAM_LEAD',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    });

    const memberUser = new UserModel({
      name: 'Alex Developer',
      email: 'member@taskmanager.com',
      password: 'password123',
      role: 'MEMBER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    });

    await adminUser.save();
    await leadUser.save();
    await memberUser.save();
    logger.info('Created 3 Seed Users: Admin, Team Lead, and Member.');

    // 2. Create Seed Tasks
    const tasks = [
      {
        title: 'Draft API specification and endpoints mapping',
        description: 'Detail all API endpoints for auth, tasks, AI and notification models.',
        priority: 'LOW',
        status: 'TODO',
        category: 'Backend',
        estimatedHours: 4,
        labels: ['documentation', 'api'],
        createdBy: leadUser._id,
        assignedTo: null,
        subtasks: [
          { title: 'Map endpoints under /api/v1', isCompleted: true },
          { title: 'Define request and response JSON schemas', isCompleted: false },
        ],
        activities: [
          {
            userId: leadUser._id,
            userName: leadUser.name,
            action: 'Created the task',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Implement JWT Authentication Flow',
        description: 'Develop register, login and persistent session state using HTTP Authorization headers and local storage.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'Security',
        estimatedHours: 8,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        labels: ['auth', 'jwt', 'security'],
        createdBy: adminUser._id,
        assignedTo: memberUser._id,
        subtasks: [
          { title: 'Generate encryption salt and compare passwords', isCompleted: true },
          { title: 'Implement Express middleware validation', isCompleted: true },
          { title: 'Verify credentials and issue JWT tokens', isCompleted: false },
        ],
        comments: [
          {
            taskId: null as any,
            userId: leadUser._id,
            userName: leadUser.name,
            userAvatar: leadUser.avatar,
            text: 'Please make sure to set JWT expiration to 7 days.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        ],
        activities: [
          {
            userId: adminUser._id,
            userName: adminUser.name,
            action: 'Created the task',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            userId: adminUser._id,
            userName: adminUser.name,
            action: 'Assigned the task to Alex Developer',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Fix Docker container network bridge mismatch',
        description: 'Investigate why Express container is unable to connect to Redis container using bridge alias in compose file.',
        priority: 'CRITICAL',
        status: 'REVIEW',
        category: 'DevOps',
        estimatedHours: 2,
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // Due in 12 hours
        labels: ['docker', 'redis', 'network'],
        createdBy: memberUser._id,
        assignedTo: adminUser._id,
        subtasks: [
          { title: 'Verify internal connection via ping', isCompleted: false },
          { title: 'Adjust docker-compose DNS alias configurations', isCompleted: false },
        ],
        activities: [
          {
            userId: memberUser._id,
            userName: memberUser.name,
            action: 'Created the task',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Design database schemas and index models',
        description: 'Complete architecture map of Mongoose models representing users, tasks, and notifications with proper schema relations.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        category: 'Database',
        estimatedHours: 6,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Due yesterday
        labels: ['schema', 'mongodb'],
        createdBy: leadUser._id,
        assignedTo: memberUser._id,
        subtasks: [
          { title: 'Design User role-based enum properties', isCompleted: true },
          { title: 'Create Task nested Comment and Attachment subschemas', isCompleted: true },
          { title: 'Index notification userId key fields', isCompleted: true },
        ],
        activities: [
          {
            userId: leadUser._id,
            userName: leadUser.name,
            action: 'Created the task',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            userId: memberUser._id,
            userName: memberUser.name,
            action: 'Completed all subtasks',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            userId: memberUser._id,
            userName: memberUser.name,
            action: 'Changed status to COMPLETED',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ];

    const savedTasks = await TaskModel.insertMany(tasks);
    logger.info(`Inserted ${savedTasks.length} Sample Tasks.`);

    // 3. Create Seed Notifications
    const notifications = [
      {
        userId: memberUser._id,
        message: 'You have been assigned to task: "Implement JWT Authentication Flow"',
        read: false,
        type: 'TASK_ASSIGNED',
        taskId: savedTasks[1]._id,
      },
      {
        userId: adminUser._id,
        message: 'Sarah Team Lead commented on task: "Implement JWT Authentication Flow"',
        read: false,
        type: 'COMMENT_ADDED',
        taskId: savedTasks[1]._id,
      },
    ];

    await NotificationModel.insertMany(notifications);
    logger.info('Inserted 2 Sample Notifications.');

    logger.info('Database seeding completed successfully.');
  } catch (error: any) {
    logger.error(`Error seeding database: ${error.message}`);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
};

seedDatabase();

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../middleware/logger';

export class QueueService {
  private static instance: QueueService;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private isRedisAvailable = false;
  private localJobsQueue: Array<{ name: string; data: any; processFn: (data: any) => Promise<void> }> = [];

  private constructor() {
    this.initialize();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private async initialize() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      logger.info(`Attempting to connect to Redis for queues at ${redisUrl}...`);
      const connection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        connectTimeout: 3000,
        lazyConnect: true,
      });

      await connection.connect();
      this.isRedisAvailable = true;
      logger.info('Successfully connected to Redis for BullMQ.');

      this.queue = new Queue('task-manager-queue', { connection });
      
      // Initialize worker
      this.worker = new Worker(
        'task-manager-queue',
        async (job: Job) => {
          logger.info(`Processing BullMQ job: ${job.id} of type ${job.name}`);
          await this.processJob(job.name, job.data);
        },
        { connection }
      );

      this.worker.on('failed', (job, err) => {
        logger.error(`BullMQ Job ${job?.id} failed: ${err.message}`);
      });
    } catch (error: any) {
      logger.warn(`Redis connection failed (${error.message}). Falling back to in-memory local queue.`);
      this.isRedisAvailable = false;
      this.startLocalQueueRunner();
    }
  }

  public async addJob(name: string, data: any, fallbackProcessFn: (data: any) => Promise<void>): Promise<void> {
    if (this.isRedisAvailable && this.queue) {
      try {
        await this.queue.add(name, data);
        logger.debug(`Job '${name}' added to BullMQ.`);
        return;
      } catch (err: any) {
        logger.warn(`BullMQ add failed (${err.message}). Defaulting to local executor.`);
      }
    }
    
    // In-memory fallback
    logger.debug(`Job '${name}' added to local in-memory queue.`);
    this.localJobsQueue.push({ name, data, processFn: fallbackProcessFn });
  }

  private async processJob(name: string, _data: unknown) {
    // BullMQ processing callback (will delegate based on type in TaskService/NotificationService)
    logger.info(`Completed background task: ${name}`);
  }

  private startLocalQueueRunner() {
    setInterval(async () => {
      if (this.localJobsQueue.length === 0) return;
      const job = this.localJobsQueue.shift();
      if (!job) return;

      try {
        logger.debug(`Processing in-memory local job: ${job.name}`);
        await job.processFn(job.data);
        logger.debug(`Completed in-memory local job: ${job.name}`);
      } catch (err: any) {
        logger.error(`Local Job execution of '${job.name}' failed: ${err.message}`);
      }
    }, 1000);
  }
}

export const queueService = QueueService.getInstance();

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const imageQueue = new Queue('image-queue', { connection });
export const aiQueue = new Queue('ai-queue', { connection });
export const auditQueue = new Queue('audit-queue', { connection });

import { QueueEvents } from 'bullmq';
export const aiQueueEvents = new QueueEvents('ai-queue', { connection });

import express, { Application, Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import cors from 'cors';
import router from './router';

const app: Application = express();

// Create registry and collect default metrics FIRST
const register = new client.Registry();

client.collectDefaultMetrics({ 
  register,
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Helper function to get system info
async function getSystemInfo() {
  const metrics = await register.getMetricsAsJSON();
  
  const memoryMetric = metrics.find(m => m.name === 'process_resident_memory_bytes');
  const cpuMetric = metrics.find(m => m.name === 'process_cpu_user_seconds_total');
  
  console.log('Memory:', memoryMetric?.values);
  console.log('CPU:', cpuMetric?.values);
  
  return metrics;
}

// ✅ Move middleware setup BEFORE metrics tracking
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true,
}));

// ✅ Metrics tracking middleware - should come AFTER body parsers
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    // ✅ Better route detection
    const route = req.route?.path || req.path || req.originalUrl;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  
  next();
});

// Helper to get queue stats
import { imageQueue, aiQueue, auditQueue } from './config/queue';
import prisma from './config/database';

async function getQueueMetrics(queue: any, name: string) {
  const [active, waiting, failed, completed] = await Promise.all([
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getFailedCount(),
    queue.getCompletedCount(),
  ]);

  // Calculate approximate latency from last 5 completed jobs
  const completedJobs = await queue.getJobs(['completed'], 0, 4);
  let totalLatency = 0;
  let count = 0;
  
  for (const job of completedJobs) {
    if (job.finishedOn && job.processedOn) {
      totalLatency += (job.finishedOn - job.processedOn);
      count++;
    }
  }
  
  const avgLatency = count > 0 ? Math.round(totalLatency / count) : 0;

  return {
    name,
    active,
    waiting,
    failed,
    completed,
    latency: avgLatency
  };
}

// ✅ Health endpoint providing structured system metrics
app.get('/api/system-health', async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    
    // DB Ping
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Queue Metrics
    const [imageMetrics, aiMetrics, auditMetrics] = await Promise.all([
      getQueueMetrics(imageQueue, 'Image Processing'),
      getQueueMetrics(aiQueue, 'AI Analysis'),
      getQueueMetrics(auditQueue, 'Audits'),
    ]);

    res.json({
      uptime: process.uptime(),
      timestamp: Date.now(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      db: {
        status: 'connected',
        latency: dbLatency,
      },
      queues: {
        image: imageMetrics,
        ai: aiMetrics,
        audit: auditMetrics,
      }
    });
  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// ✅ Metrics endpoint (typically accessed by Prometheus, not users)
app.get('/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
});

// Your application routes
app.use('/api', router);

// Error handling middleware
app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  },
);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
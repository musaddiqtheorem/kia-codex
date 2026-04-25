import cors from 'cors';
import express from 'express';
import aiRouter from './routes/ai.router';
import analyticsRouter from './routes/analytics.router';
import dashboardRouter from './routes/dashboard.router';
import healthRouter from './routes/health.router';
import uploadRouter from './routes/upload.router';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/ai', aiRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: err.message || 'Unexpected server error' });
  });

  return app;
};

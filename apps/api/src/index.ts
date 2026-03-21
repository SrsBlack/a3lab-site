import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { rateLimit } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import userRoutes from './routes/users';
import verificationRoutes from './routes/verification';

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit
app.use(rateLimit());

// ─── Health Check ────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'proof-api',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use('/verification', verificationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// ─── Start Server ────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`PROOF API running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});

export default app;

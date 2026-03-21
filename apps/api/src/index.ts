import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { rateLimit } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import userRoutes from './routes/users';
import verificationRoutes from './routes/verification';
import mediaRoutes from './routes/media';
import notificationRoutes from './routes/notifications';
import commentRoutes from './routes/comments';
import moderationRoutes from './routes/moderation';
import { authMiddleware } from './middleware/auth';

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
app.use('/media', mediaRoutes);
app.use('/notifications', notificationRoutes);
app.use('/moderation', moderationRoutes);
app.use('/', commentRoutes);

// ─── Aliases ────────────────────────────────────────────────────────

// Mobile client calls GET /feed; backend has it under /posts/feed
app.get('/feed', authMiddleware, (req, res, next) => {
  req.url = '/posts/feed';
  app.handle(req, res, next);
});

// Mobile client calls GET /bookmarks; serve bookmarked posts list
app.get('/bookmarks', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user!.userId;
    const cursor = req.query.cursor as string | undefined;
    const { prisma } = require('./db');

    const whereClause: any = { userId };
    if (cursor) {
      whereClause.createdAt = { lt: new Date(cursor) };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 21,
      include: {
        post: {
          include: {
            author: {
              select: { id: true, username: true, isVerified: true },
            },
          },
        },
      },
    });

    const hasMore = bookmarks.length > 20;
    const page = hasMore ? bookmarks.slice(0, 20) : bookmarks;

    res.json({
      bookmarks: page.map((b: any) => ({
        id: b.post.id,
        contentType: b.post.contentType,
        mediaUrl: b.post.mediaUrl,
        textBody: b.post.textBody,
        createdAt: b.post.createdAt,
        author: b.post.author,
      })),
      nextCursor: hasMore
        ? page[page.length - 1].createdAt.toISOString()
        : null,
      hasMore,
    });
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

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

import { FlagReason, FlagStatus } from '@prisma/client';
import { prisma } from '../db';
import { config } from '../config';

/**
 * Flag a post as suspicious.
 */
export async function flagPost(
  postId: string,
  reporterId: string,
  reason: FlagReason
): Promise<{ id: string }> {
  // Check if user already flagged this post
  const existing = await prisma.flag.findFirst({
    where: { postId, reporterId },
  });

  if (existing) {
    throw new Error('You have already flagged this post');
  }

  // Verify the post exists
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  // Don't allow flagging your own post
  if (post.authorId === reporterId) {
    throw new Error('You cannot flag your own post');
  }

  const flag = await prisma.flag.create({
    data: {
      postId,
      reporterId,
      reason,
      status: 'PENDING',
    },
  });

  // If a post accumulates 3+ flags, automatically mark it as not authentic
  // pending review
  const flagCount = await prisma.flag.count({
    where: { postId, status: 'PENDING' },
  });

  if (flagCount >= 3) {
    await prisma.post.update({
      where: { id: postId },
      data: { isAuthentic: false },
    });
  }

  return { id: flag.id };
}

/**
 * Get the moderation queue (pending flags).
 * Only accessible to users with trust score >= 75.
 */
export async function getModQueue(reviewerUserId: string): Promise<{
  flags: Array<{
    id: string;
    postId: string;
    reason: FlagReason;
    reporterId: string;
    createdAt: Date;
    post: {
      id: string;
      contentType: string;
      textBody: string | null;
      mediaUrl: string | null;
      authorId: string;
    };
  }>;
}> {
  // Verify reviewer has sufficient trust score
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerUserId },
    select: { trustScore: true },
  });

  if (!reviewer || reviewer.trustScore < config.moderatorTrustThreshold) {
    throw new Error('Insufficient trust score for moderation access');
  }

  const flags = await prisma.flag.findMany({
    where: { status: 'PENDING' },
    include: {
      post: {
        select: {
          id: true,
          contentType: true,
          textBody: true,
          mediaUrl: true,
          authorId: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return { flags };
}

/**
 * Review a flag and make a decision.
 * - 'REVIEWED' means the flag was valid and action was taken on the post.
 * - 'DISMISSED' means the flag was invalid.
 */
export async function reviewFlag(
  flagId: string,
  reviewerId: string,
  decision: 'REVIEWED' | 'DISMISSED'
): Promise<void> {
  // Verify reviewer has sufficient trust score
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { trustScore: true },
  });

  if (!reviewer || reviewer.trustScore < config.moderatorTrustThreshold) {
    throw new Error('Insufficient trust score for moderation access');
  }

  const flag = await prisma.flag.findUnique({
    where: { id: flagId },
  });

  if (!flag) {
    throw new Error('Flag not found');
  }

  if (flag.status !== 'PENDING') {
    throw new Error('Flag has already been reviewed');
  }

  // Don't allow reviewing flags on your own posts
  const post = await prisma.post.findUnique({
    where: { id: flag.postId },
    select: { authorId: true },
  });

  if (post && post.authorId === reviewerId) {
    throw new Error('You cannot review flags on your own posts');
  }

  await prisma.flag.update({
    where: { id: flagId },
    data: {
      status: decision as FlagStatus,
      reviewedBy: reviewerId,
    },
  });

  // If flag was upheld, mark the post as not authentic
  if (decision === 'REVIEWED') {
    await prisma.post.update({
      where: { id: flag.postId },
      data: { isAuthentic: false },
    });
  }

  // If flag was dismissed and it was the last pending flag,
  // restore the post's authentic status
  if (decision === 'DISMISSED') {
    const remainingFlags = await prisma.flag.count({
      where: {
        postId: flag.postId,
        status: 'PENDING',
      },
    });

    const upheldFlags = await prisma.flag.count({
      where: {
        postId: flag.postId,
        status: 'REVIEWED',
      },
    });

    if (remainingFlags === 0 && upheldFlags === 0) {
      await prisma.post.update({
        where: { id: flag.postId },
        data: { isAuthentic: true },
      });
    }
  }
}

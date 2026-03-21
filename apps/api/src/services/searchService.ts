import { prisma } from '../db';

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  isVerified: boolean;
  postCount: number;
}

/**
 * Search for users by username or display name.
 * In production, this would use Elasticsearch or Meilisearch.
 * For now, we use Prisma's built-in text search.
 */
export async function searchUsers(
  query: string,
  limit: number = 20
): Promise<UserSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      isVerified: true,
      _count: {
        select: { posts: true },
      },
    },
    take: limit,
    orderBy: [
      { isVerified: 'desc' },  // Verified users first
      { username: 'asc' },
    ],
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    isVerified: u.isVerified,
    postCount: u._count.posts,
  }));
}

/**
 * Get suggested users to follow.
 * Returns verified users that the requesting user doesn't follow yet.
 */
export async function getSuggestedUsers(
  userId: string,
  limit: number = 10
): Promise<UserSearchResult[]> {
  // Get IDs the user already follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  followingIds.push(userId); // Exclude self

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      isVerified: true,
      id: { notIn: followingIds },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      isVerified: true,
      _count: {
        select: { posts: true },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    isVerified: u.isVerified,
    postCount: u._count.posts,
  }));
}

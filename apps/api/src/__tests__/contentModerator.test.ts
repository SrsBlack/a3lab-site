import { flagPost, getModQueue, reviewFlag } from '../services/contentModerator';

// Mock Prisma
const mockFlagFindFirst = jest.fn();
const mockFlagFindMany = jest.fn();
const mockFlagFindUnique = jest.fn();
const mockFlagCreate = jest.fn();
const mockFlagCount = jest.fn();
const mockFlagUpdate = jest.fn();
const mockPostFindUnique = jest.fn();
const mockPostUpdate = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('../db', () => ({
  prisma: {
    flag: {
      findFirst: (...args: unknown[]) => mockFlagFindFirst(...args),
      findMany: (...args: unknown[]) => mockFlagFindMany(...args),
      findUnique: (...args: unknown[]) => mockFlagFindUnique(...args),
      create: (...args: unknown[]) => mockFlagCreate(...args),
      count: (...args: unknown[]) => mockFlagCount(...args),
      update: (...args: unknown[]) => mockFlagUpdate(...args),
    },
    post: {
      findUnique: (...args: unknown[]) => mockPostFindUnique(...args),
      update: (...args: unknown[]) => mockPostUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

jest.mock('../config', () => ({
  config: {
    moderatorTrustThreshold: 75,
  },
}));

describe('contentModerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('flagPost', () => {
    const postId = 'post-1';
    const reporterId = 'reporter-1';
    const reason = 'INAPPROPRIATE' as const;

    it('should create a flag and return its id', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue({ id: postId, authorId: 'author-1' });
      mockFlagCreate.mockResolvedValue({ id: 'flag-1' });
      mockFlagCount.mockResolvedValue(1);

      const result = await flagPost(postId, reporterId, reason);

      expect(result).toEqual({ id: 'flag-1' });
      expect(mockFlagCreate).toHaveBeenCalledWith({
        data: {
          postId,
          reporterId,
          reason,
          status: 'PENDING',
        },
      });
    });

    it('should throw if user already flagged this post', async () => {
      mockFlagFindFirst.mockResolvedValue({ id: 'existing-flag' });

      await expect(flagPost(postId, reporterId, reason)).rejects.toThrow(
        'You have already flagged this post'
      );
    });

    it('should throw if the post does not exist', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue(null);

      await expect(flagPost(postId, reporterId, reason)).rejects.toThrow(
        'Post not found'
      );
    });

    it('should throw if user tries to flag their own post', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue({ id: postId, authorId: reporterId });

      await expect(flagPost(postId, reporterId, reason)).rejects.toThrow(
        'You cannot flag your own post'
      );
    });

    it('should auto-mark post as not authentic when flag count reaches 3', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue({ id: postId, authorId: 'author-1' });
      mockFlagCreate.mockResolvedValue({ id: 'flag-3' });
      mockFlagCount.mockResolvedValue(3);
      mockPostUpdate.mockResolvedValue({});

      await flagPost(postId, reporterId, reason);

      expect(mockPostUpdate).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isAuthentic: false },
      });
    });

    it('should auto-mark post as not authentic when flag count exceeds 3', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue({ id: postId, authorId: 'author-1' });
      mockFlagCreate.mockResolvedValue({ id: 'flag-5' });
      mockFlagCount.mockResolvedValue(5);
      mockPostUpdate.mockResolvedValue({});

      await flagPost(postId, reporterId, reason);

      expect(mockPostUpdate).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isAuthentic: false },
      });
    });

    it('should not mark post as not authentic when flag count is below 3', async () => {
      mockFlagFindFirst.mockResolvedValue(null);
      mockPostFindUnique.mockResolvedValue({ id: postId, authorId: 'author-1' });
      mockFlagCreate.mockResolvedValue({ id: 'flag-2' });
      mockFlagCount.mockResolvedValue(2);

      await flagPost(postId, reporterId, reason);

      expect(mockPostUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getModQueue', () => {
    const reviewerUserId = 'mod-1';

    it('should return pending flags for a user with sufficient trust', async () => {
      const mockFlags = [
        {
          id: 'flag-1',
          postId: 'post-1',
          reason: 'INAPPROPRIATE',
          reporterId: 'user-2',
          createdAt: new Date(),
          post: {
            id: 'post-1',
            contentType: 'image/jpeg',
            textBody: 'some text',
            mediaUrl: 'https://cdn.example.com/img.jpg',
            authorId: 'user-3',
          },
        },
      ];

      mockUserFindUnique.mockResolvedValue({ trustScore: 80 });
      mockFlagFindMany.mockResolvedValue(mockFlags);

      const result = await getModQueue(reviewerUserId);

      expect(result.flags).toEqual(mockFlags);
      expect(mockFlagFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          take: 50,
        })
      );
    });

    it('should throw if user trust score is below 75', async () => {
      mockUserFindUnique.mockResolvedValue({ trustScore: 74 });

      await expect(getModQueue(reviewerUserId)).rejects.toThrow(
        'Insufficient trust score for moderation access'
      );
    });

    it('should throw if user is not found', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(getModQueue(reviewerUserId)).rejects.toThrow(
        'Insufficient trust score for moderation access'
      );
    });

    it('should allow access at exactly trust score 75', async () => {
      mockUserFindUnique.mockResolvedValue({ trustScore: 75 });
      mockFlagFindMany.mockResolvedValue([]);

      const result = await getModQueue(reviewerUserId);
      expect(result.flags).toEqual([]);
    });
  });

  describe('reviewFlag', () => {
    const flagId = 'flag-1';
    const reviewerId = 'mod-1';
    const flagData = {
      id: flagId,
      postId: 'post-1',
      reporterId: 'reporter-1',
      status: 'PENDING',
    };

    beforeEach(() => {
      mockUserFindUnique.mockResolvedValue({ trustScore: 80 });
      mockFlagFindUnique.mockResolvedValue(flagData);
      mockPostFindUnique.mockResolvedValue({ authorId: 'author-1' });
      mockFlagUpdate.mockResolvedValue({});
      mockPostUpdate.mockResolvedValue({});
    });

    it('should update flag status to REVIEWED when upheld', async () => {
      await reviewFlag(flagId, reviewerId, 'REVIEWED');

      expect(mockFlagUpdate).toHaveBeenCalledWith({
        where: { id: flagId },
        data: { status: 'REVIEWED', reviewedBy: reviewerId },
      });
    });

    it('should mark post as not authentic when flag is upheld', async () => {
      await reviewFlag(flagId, reviewerId, 'REVIEWED');

      expect(mockPostUpdate).toHaveBeenCalledWith({
        where: { id: flagData.postId },
        data: { isAuthentic: false },
      });
    });

    it('should update flag status to DISMISSED', async () => {
      mockFlagCount
        .mockResolvedValueOnce(0)  // remaining pending
        .mockResolvedValueOnce(0); // upheld

      await reviewFlag(flagId, reviewerId, 'DISMISSED');

      expect(mockFlagUpdate).toHaveBeenCalledWith({
        where: { id: flagId },
        data: { status: 'DISMISSED', reviewedBy: reviewerId },
      });
    });

    it('should restore post authenticity when last pending flag is dismissed and none upheld', async () => {
      mockFlagCount
        .mockResolvedValueOnce(0)  // remaining pending
        .mockResolvedValueOnce(0); // upheld

      await reviewFlag(flagId, reviewerId, 'DISMISSED');

      expect(mockPostUpdate).toHaveBeenCalledWith({
        where: { id: flagData.postId },
        data: { isAuthentic: true },
      });
    });

    it('should not restore authenticity if there are still pending flags', async () => {
      mockFlagCount
        .mockResolvedValueOnce(2)  // remaining pending
        .mockResolvedValueOnce(0); // upheld

      await reviewFlag(flagId, reviewerId, 'DISMISSED');

      expect(mockPostUpdate).not.toHaveBeenCalled();
    });

    it('should not restore authenticity if there are upheld flags', async () => {
      mockFlagCount
        .mockResolvedValueOnce(0)  // remaining pending
        .mockResolvedValueOnce(1); // upheld

      await reviewFlag(flagId, reviewerId, 'DISMISSED');

      expect(mockPostUpdate).not.toHaveBeenCalled();
    });

    it('should throw if reviewer trust score is below threshold', async () => {
      mockUserFindUnique.mockResolvedValue({ trustScore: 50 });

      await expect(reviewFlag(flagId, reviewerId, 'REVIEWED')).rejects.toThrow(
        'Insufficient trust score for moderation access'
      );
    });

    it('should throw if flag is not found', async () => {
      mockFlagFindUnique.mockResolvedValue(null);

      await expect(reviewFlag(flagId, reviewerId, 'REVIEWED')).rejects.toThrow(
        'Flag not found'
      );
    });

    it('should throw if flag has already been reviewed', async () => {
      mockFlagFindUnique.mockResolvedValue({ ...flagData, status: 'REVIEWED' });

      await expect(reviewFlag(flagId, reviewerId, 'REVIEWED')).rejects.toThrow(
        'Flag has already been reviewed'
      );
    });

    it('should throw if reviewer is the post author (self-review)', async () => {
      mockPostFindUnique.mockResolvedValue({ authorId: reviewerId });

      await expect(reviewFlag(flagId, reviewerId, 'REVIEWED')).rejects.toThrow(
        'You cannot review flags on your own posts'
      );
    });
  });
});

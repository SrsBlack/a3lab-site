import {
  calculateTrustScore,
  recalculateTrustScore,
  updateVerificationStatus,
  getTrustBreakdown,
  TRUST_POINTS,
  TRUST_CAPS,
} from '../services/trustEngine';

// Mock Prisma
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../db', () => ({
  prisma: {
    identityCheck: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock('../config', () => ({
  config: {
    verifiedThreshold: 35,
  },
}));

function makeCheck(checkType: string) {
  return { checkType, status: 'PASSED' };
}

describe('trustEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TRUST_POINTS constants', () => {
    it('should have correct point values', () => {
      expect(TRUST_POINTS.PHONE).toBe(10);
      expect(TRUST_POINTS.SELFIE).toBe(25);
      expect(TRUST_POINTS.VOUCH).toBe(15);
      expect(TRUST_POINTS.CONSISTENCY).toBe(1);
      expect(TRUST_POINTS.DEVICE).toBe(10);
      expect(TRUST_POINTS.BEHAVIORAL).toBe(10);
    });

    it('should have correct cap values', () => {
      expect(TRUST_CAPS.VOUCH).toBe(45);
      expect(TRUST_CAPS.CONSISTENCY).toBe(20);
    });

    it('should sum to a maximum of 120', () => {
      const max =
        TRUST_POINTS.PHONE +
        TRUST_POINTS.SELFIE +
        TRUST_CAPS.VOUCH +
        TRUST_CAPS.CONSISTENCY +
        TRUST_POINTS.DEVICE +
        TRUST_POINTS.BEHAVIORAL;
      expect(max).toBe(120);
    });
  });

  describe('calculateTrustScore', () => {
    it('should return 0 for a user with no checks', async () => {
      mockFindMany.mockResolvedValue([]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(0);
    });

    it('should query only PASSED checks for the given user', async () => {
      mockFindMany.mockResolvedValue([]);
      await calculateTrustScore('user-1');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: 'PASSED' },
      });
    });

    it('should score PHONE at 10 points', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE')]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(10);
    });

    it('should score SELFIE at 25 points', async () => {
      mockFindMany.mockResolvedValue([makeCheck('SELFIE')]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(25);
    });

    it('should score DEVICE at 10 points', async () => {
      mockFindMany.mockResolvedValue([makeCheck('DEVICE')]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(10);
    });

    it('should score BEHAVIORAL at 10 points', async () => {
      mockFindMany.mockResolvedValue([makeCheck('BEHAVIORAL')]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(10);
    });

    it('should score a single VOUCH at 15 points', async () => {
      mockFindMany.mockResolvedValue([makeCheck('VOUCH')]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(15);
    });

    it('should cap VOUCH points at 45 for 3 vouches', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
      ]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(45);
    });

    it('should cap VOUCH points at 45 even with more than 3 vouches', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
      ]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(45);
    });

    it('should score CONSISTENCY at 1 point per week', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('CONSISTENCY'),
        makeCheck('CONSISTENCY'),
        makeCheck('CONSISTENCY'),
      ]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(3);
    });

    it('should cap CONSISTENCY at 20 points', async () => {
      const consistencyChecks = Array.from({ length: 25 }, () =>
        makeCheck('CONSISTENCY')
      );
      mockFindMany.mockResolvedValue(consistencyChecks);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(20);
    });

    it('should sum all check types correctly for max score', async () => {
      const checks = [
        makeCheck('PHONE'),
        makeCheck('SELFIE'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        ...Array.from({ length: 20 }, () => makeCheck('CONSISTENCY')),
        makeCheck('DEVICE'),
        makeCheck('BEHAVIORAL'),
      ];
      mockFindMany.mockResolvedValue(checks);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(120);
    });

    it('should handle a mixed subset of checks', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('PHONE'),
        makeCheck('SELFIE'),
      ]);
      const score = await calculateTrustScore('user-1');
      expect(score).toBe(35);
    });
  });

  describe('recalculateTrustScore', () => {
    it('should calculate, persist, and return the score', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE'), makeCheck('SELFIE')]);
      mockUpdate.mockResolvedValue({});

      const score = await recalculateTrustScore('user-1');

      expect(score).toBe(35);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { trustScore: 35, isVerified: true },
      });
    });

    it('should set isVerified to false when score is below threshold', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE')]);
      mockUpdate.mockResolvedValue({});

      const score = await recalculateTrustScore('user-1');

      expect(score).toBe(10);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { trustScore: 10, isVerified: false },
      });
    });

    it('should set isVerified to true when score equals threshold', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE'), makeCheck('SELFIE')]);
      mockUpdate.mockResolvedValue({});

      await recalculateTrustScore('user-1');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: true }),
        })
      );
    });
  });

  describe('updateVerificationStatus', () => {
    it('should return true when score meets threshold', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE'), makeCheck('SELFIE')]);
      mockUpdate.mockResolvedValue({});

      const result = await updateVerificationStatus('user-1');
      expect(result).toBe(true);
    });

    it('should return false when score is below threshold', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE')]);
      mockUpdate.mockResolvedValue({});

      const result = await updateVerificationStatus('user-1');
      expect(result).toBe(false);
    });

    it('should persist both score and verification status', async () => {
      mockFindMany.mockResolvedValue([]);
      mockUpdate.mockResolvedValue({});

      await updateVerificationStatus('user-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { trustScore: 0, isVerified: false },
      });
    });
  });

  describe('getTrustBreakdown', () => {
    it('should return a zeroed breakdown for no checks', async () => {
      mockFindMany.mockResolvedValue([]);

      const breakdown = await getTrustBreakdown('user-1');

      expect(breakdown).toEqual({
        total: 0,
        phone: 0,
        selfie: 0,
        vouch: 0,
        consistency: 0,
        device: 0,
        behavioral: 0,
        isVerified: false,
      });
    });

    it('should break down each check type individually', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('PHONE'),
        makeCheck('SELFIE'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('DEVICE'),
        makeCheck('BEHAVIORAL'),
      ]);

      const breakdown = await getTrustBreakdown('user-1');

      expect(breakdown.phone).toBe(10);
      expect(breakdown.selfie).toBe(25);
      expect(breakdown.vouch).toBe(30);
      expect(breakdown.device).toBe(10);
      expect(breakdown.behavioral).toBe(10);
      expect(breakdown.consistency).toBe(0);
      expect(breakdown.total).toBe(85);
      expect(breakdown.isVerified).toBe(true);
    });

    it('should cap vouch in breakdown at 45', async () => {
      mockFindMany.mockResolvedValue([
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
        makeCheck('VOUCH'),
      ]);

      const breakdown = await getTrustBreakdown('user-1');
      expect(breakdown.vouch).toBe(45);
      expect(breakdown.total).toBe(45);
    });

    it('should cap consistency in breakdown at 20', async () => {
      const checks = Array.from({ length: 30 }, () => makeCheck('CONSISTENCY'));
      mockFindMany.mockResolvedValue(checks);

      const breakdown = await getTrustBreakdown('user-1');
      expect(breakdown.consistency).toBe(20);
      expect(breakdown.total).toBe(20);
    });

    it('should set isVerified based on total vs threshold', async () => {
      mockFindMany.mockResolvedValue([makeCheck('PHONE')]);

      const breakdown = await getTrustBreakdown('user-1');
      expect(breakdown.total).toBe(10);
      expect(breakdown.isVerified).toBe(false);
    });
  });
});

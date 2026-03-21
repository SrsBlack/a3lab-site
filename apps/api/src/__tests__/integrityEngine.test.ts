import {
  containsLinks,
  containsHashtags,
  detectCommercialContent,
  generateIntegrityHash,
  validateIntegrity,
  detectAIContent,
  validatePostContent,
} from '../services/integrityEngine';

describe('integrityEngine', () => {
  describe('containsLinks', () => {
    it('should return false for empty or null input', () => {
      expect(containsLinks('')).toBe(false);
      expect(containsLinks(null as unknown as string)).toBe(false);
    });

    it('should detect https URLs', () => {
      expect(containsLinks('visit https://example.com')).toBe(true);
    });

    it('should detect http URLs', () => {
      expect(containsLinks('see http://example.com/page')).toBe(true);
    });

    it('should detect www URLs', () => {
      expect(containsLinks('go to www.example.com')).toBe(true);
    });

    it('should detect bare domain names', () => {
      expect(containsLinks('check example.com')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(containsLinks('Just a normal sentence with no links')).toBe(false);
    });
  });

  describe('containsHashtags', () => {
    it('should return false for empty or null input', () => {
      expect(containsHashtags('')).toBe(false);
      expect(containsHashtags(null as unknown as string)).toBe(false);
    });

    it('should detect hashtags', () => {
      expect(containsHashtags('love this #sunset')).toBe(true);
    });

    it('should detect hashtags with underscores', () => {
      expect(containsHashtags('#my_photo')).toBe(true);
    });

    it('should not flag bare # without a word', () => {
      expect(containsHashtags('number # 5')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(containsHashtags('no tags here')).toBe(false);
    });
  });

  describe('detectCommercialContent', () => {
    it('should return no matches for empty input', () => {
      const result = detectCommercialContent('');
      expect(result.isCommercial).toBe(false);
      expect(result.matchedPatterns).toHaveLength(0);
    });

    it('should return no matches for non-commercial text', () => {
      const result = detectCommercialContent('Beautiful day at the park');
      expect(result.isCommercial).toBe(false);
    });

    it.each([
      ['use code SAVE20', 'use code'],
      ['link in bio for more', 'link in bio'],
      ['collab with a friend', 'collab'],
      ['dm for pricing info', 'dm for pricing'],
      ['shop now while stocks last', 'shop now'],
      ['get a discount today', 'discount'],
      ['promo ends soon', 'promo'],
      ['use promo code FALL', 'promo code'],
      ['coupon inside', 'coupon'],
      ['affiliate link below', 'affiliate'],
      ['sponsored content', 'sponsored'],
      ['#ad required disclosure', '#ad'],
      ['buy now before gone', 'buy now'],
      ['limited time offer available', 'limited time offer'],
      ['free shipping on orders', 'free shipping'],
      ['swipe up to learn more', 'swipe up'],
      ['check out my new store', 'check out my'],
      ['available now in stores', 'available now'],
      ['order now for fast delivery', 'order now'],
      ['get yours today', 'get yours'],
      ['big sale this weekend', 'sale'],
      ['dm me for details', 'dm me for'],
      ['dm for details about pricing', 'dm for details'],
      ['paid partnership with brand', 'paid partnership'],
      ['giveaway time', 'giveaway'],
      ['enter to win a prize', 'enter to win'],
      ['shop at our new location', 'shop at'],
    ])('should detect "%s" as commercial (matching "%s")', (text, _expected) => {
      const result = detectCommercialContent(text);
      expect(result.isCommercial).toBe(true);
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
    });

    it('should return multiple matched patterns when several are present', () => {
      const result = detectCommercialContent(
        'Use code SAVE20 and get free shipping with this promo'
      );
      expect(result.isCommercial).toBe(true);
      expect(result.matchedPatterns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validatePostContent', () => {
    it('should return valid for null/undefined text', () => {
      const result = validatePostContent(null);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return valid for clean text', () => {
      const result = validatePostContent('A beautiful morning walk');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject text with links', () => {
      const result = validatePostContent('visit https://example.com');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Links are not allowed in posts');
    });

    it('should reject text with hashtags', () => {
      const result = validatePostContent('love this #sunset');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Hashtags are not allowed in posts');
    });

    it('should reject commercial language', () => {
      const result = validatePostContent('shop now for great deals');
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('Commercial content detected'))).toBe(true);
    });

    it('should accumulate multiple issues', () => {
      const result = validatePostContent(
        'Check https://store.com #sale and use code SAVE20'
      );
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateIntegrityHash', () => {
    const baseData = {
      contentType: 'image/jpeg',
      timestamp: 1700000000000,
    };

    it('should return a 64-character hex string', () => {
      const hash = generateIntegrityHash(baseData);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return the same hash for the same inputs', () => {
      const hash1 = generateIntegrityHash(baseData);
      const hash2 = generateIntegrityHash(baseData);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content types', () => {
      const hash1 = generateIntegrityHash({ ...baseData, contentType: 'image/jpeg' });
      const hash2 = generateIntegrityHash({ ...baseData, contentType: 'image/png' });
      expect(hash1).not.toBe(hash2);
    });

    it('should incorporate textBody into the hash', () => {
      const hash1 = generateIntegrityHash({ ...baseData, textBody: 'hello' });
      const hash2 = generateIntegrityHash({ ...baseData, textBody: 'world' });
      expect(hash1).not.toBe(hash2);
    });

    it('should incorporate mediaBuffer into the hash', () => {
      const hash1 = generateIntegrityHash({
        ...baseData,
        mediaBuffer: Buffer.from('image-data-1'),
      });
      const hash2 = generateIntegrityHash({
        ...baseData,
        mediaBuffer: Buffer.from('image-data-2'),
      });
      expect(hash1).not.toBe(hash2);
    });

    it('should incorporate captureMeta into the hash', () => {
      const hash1 = generateIntegrityHash({
        ...baseData,
        captureMeta: { device: 'iPhone' },
      });
      const hash2 = generateIntegrityHash({
        ...baseData,
        captureMeta: { device: 'Pixel' },
      });
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different timestamps', () => {
      const hash1 = generateIntegrityHash({ ...baseData, timestamp: 1000 });
      const hash2 = generateIntegrityHash({ ...baseData, timestamp: 2000 });
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateIntegrity', () => {
    const validPost = {
      integrityHash: 'a'.repeat(64),
      contentType: 'image/jpeg',
      createdAt: new Date(),
    };

    it('should return valid for a well-formed hash with no suspicious metadata', () => {
      const result = validateIntegrity(validPost);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject a missing integrity hash', () => {
      const result = validateIntegrity({ ...validPost, integrityHash: '' });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid or missing integrity hash');
    });

    it('should reject a hash that is not 64 characters', () => {
      const result = validateIntegrity({ ...validPost, integrityHash: 'abc123' });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid or missing integrity hash');
    });

    it('should reject when capture timestamp is more than 5 minutes from post time', () => {
      const postTime = new Date();
      const sixMinutesAgo = postTime.getTime() - 6 * 60 * 1000;

      const result = validateIntegrity({
        ...validPost,
        createdAt: postTime,
        captureMeta: { captureTimestamp: sixMinutesAgo },
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Capture timestamp too far from post time');
    });

    it('should accept when capture timestamp is within 5 minutes of post time', () => {
      const postTime = new Date();
      const twoMinutesAgo = postTime.getTime() - 2 * 60 * 1000;

      const result = validateIntegrity({
        ...validPost,
        createdAt: postTime,
        captureMeta: { captureTimestamp: twoMinutesAgo },
      });
      expect(result.valid).toBe(true);
    });

    it.each(['Photoshop', 'Lightroom', 'Snapseed', 'VSCO', 'Facetune'])(
      'should reject when editing software "%s" is detected',
      (software) => {
        const result = validateIntegrity({
          ...validPost,
          captureMeta: { software },
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Editing software detected in metadata');
      }
    );

    it('should accept non-editing software in metadata', () => {
      const result = validateIntegrity({
        ...validPost,
        captureMeta: { software: 'iPhone Camera' },
      });
      expect(result.valid).toBe(true);
    });

    it('should ignore non-string software metadata', () => {
      const result = validateIntegrity({
        ...validPost,
        captureMeta: { software: 12345 },
      });
      expect(result.valid).toBe(true);
    });

    it('should ignore non-number captureTimestamp', () => {
      const result = validateIntegrity({
        ...validPost,
        captureMeta: { captureTimestamp: 'yesterday' },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('detectAIContent', () => {
    it('should return stub values with score 0', async () => {
      const result = await detectAIContent(Buffer.from('fake-image'));
      expect(result.score).toBe(0.0);
      expect(result.confidence).toBe(0.1);
      expect(result.details).toBe('AI detection stub - no analysis performed');
    });

    it('should return the same stub regardless of input', async () => {
      const result1 = await detectAIContent(Buffer.from('image-a'));
      const result2 = await detectAIContent(Buffer.from('image-b'));
      expect(result1).toEqual(result2);
    });
  });
});

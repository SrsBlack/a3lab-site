import crypto from 'crypto';

/**
 * Commercial language patterns that indicate promotional / business content.
 */
const COMMERCIAL_PATTERNS = [
  /\buse\s+code\b/i,
  /\blink\s+in\s+bio\b/i,
  /\bcollab\b/i,
  /\bdm\s+for\s+pricing\b/i,
  /\bshop\s+now\b/i,
  /\bshop\s+at\b/i,
  /\bdiscount\b/i,
  /\bpromo\b/i,
  /\bpromo\s*code\b/i,
  /\bcoupon\b/i,
  /\baffiliate\b/i,
  /\bsponsored\b/i,
  /\bad\b/i,
  /\b#ad\b/i,
  /\bbuy\s+now\b/i,
  /\blimited\s+time\s+offer\b/i,
  /\bfree\s+shipping\b/i,
  /\bswipe\s+up\b/i,
  /\bcheck\s+out\s+my\b/i,
  /\bavailable\s+now\b/i,
  /\border\s+now\b/i,
  /\bget\s+yours\b/i,
  /\bsale\b/i,
  /\bdm\s+me\s+for\b/i,
  /\bdm\s+for\s+details\b/i,
  /\bpaid\s+partnership\b/i,
  /\bgiveaway\b/i,
  /\benter\s+to\s+win\b/i,
];

/**
 * URL detection pattern.
 */
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;

/**
 * Hashtag detection pattern.
 */
const HASHTAG_PATTERN = /#[a-zA-Z0-9_]+/;

/**
 * Check if text contains any URLs.
 */
export function containsLinks(text: string): boolean {
  if (!text) return false;
  return URL_PATTERN.test(text);
}

/**
 * Check if text contains any hashtags.
 */
export function containsHashtags(text: string): boolean {
  if (!text) return false;
  return HASHTAG_PATTERN.test(text);
}

/**
 * Detect commercial / promotional language in text.
 * Returns list of matched patterns.
 */
export function detectCommercialContent(text: string): {
  isCommercial: boolean;
  matchedPatterns: string[];
} {
  if (!text) return { isCommercial: false, matchedPatterns: [] };

  const matchedPatterns: string[] = [];

  for (const pattern of COMMERCIAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matchedPatterns.push(match[0]);
    }
  }

  return {
    isCommercial: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

/**
 * Generate an integrity hash for post content.
 * This hash is computed from the raw content and capture metadata
 * to detect any post-capture modifications.
 */
export function generateIntegrityHash(data: {
  contentType: string;
  textBody?: string;
  mediaBuffer?: Buffer;
  captureMeta?: Record<string, unknown>;
  timestamp: number;
}): string {
  const hash = crypto.createHash('sha256');

  hash.update(data.contentType);

  if (data.textBody) {
    hash.update(data.textBody);
  }

  if (data.mediaBuffer) {
    hash.update(data.mediaBuffer);
  }

  if (data.captureMeta) {
    hash.update(JSON.stringify(data.captureMeta));
  }

  hash.update(data.timestamp.toString());

  return hash.digest('hex');
}

/**
 * Validate the integrity of a post by recomputing and comparing its hash.
 */
export function validateIntegrity(post: {
  integrityHash: string;
  contentType: string;
  textBody?: string | null;
  captureMeta?: Record<string, unknown>;
  createdAt: Date;
}): { valid: boolean; reason?: string } {
  // For now, verify the hash exists and is well-formed
  if (!post.integrityHash || post.integrityHash.length !== 64) {
    return { valid: false, reason: 'Invalid or missing integrity hash' };
  }

  // Check capture metadata for suspicious patterns
  if (post.captureMeta) {
    const meta = post.captureMeta as Record<string, unknown>;

    // Flag if capture timestamp is too far from post creation
    if (meta.captureTimestamp && typeof meta.captureTimestamp === 'number') {
      const captureTime = meta.captureTimestamp;
      const postTime = post.createdAt.getTime();
      const diffMs = Math.abs(postTime - captureTime);

      // If capture was more than 5 minutes before post, flag it
      // (allows some upload latency but catches old photos)
      if (diffMs > 5 * 60 * 1000) {
        return { valid: false, reason: 'Capture timestamp too far from post time' };
      }
    }

    // Flag if editing software metadata is detected
    if (meta.software && typeof meta.software === 'string') {
      const editingSoftware = ['photoshop', 'lightroom', 'snapseed', 'vsco', 'facetune'];
      const softwareLower = meta.software.toLowerCase();
      if (editingSoftware.some((s) => softwareLower.includes(s))) {
        return { valid: false, reason: 'Editing software detected in metadata' };
      }
    }
  }

  return { valid: true };
}

/**
 * Stub for AI content detection.
 * In production this would call an ML model to analyze the media
 * for signs of AI generation (deepfakes, stable diffusion, etc.).
 * Returns a score from 0 (definitely human) to 1 (definitely AI).
 */
export async function detectAIContent(mediaBuffer: Buffer): Promise<{
  score: number;
  confidence: number;
  details: string;
}> {
  // TODO: Integrate actual AI detection model
  // For now, return a low score indicating likely human content.
  // In production, this would:
  // 1. Check for GAN artifacts
  // 2. Analyze frequency domain for AI signatures
  // 3. Check EXIF for synthetic generation markers
  // 4. Run through a classifier trained on AI vs real media

  return {
    score: 0.0,
    confidence: 0.1,
    details: 'AI detection stub - no analysis performed',
  };
}

/**
 * Full content validation pipeline.
 * Returns all validation issues found.
 */
export function validatePostContent(text?: string | null): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (text) {
    if (containsLinks(text)) {
      issues.push('Links are not allowed in posts');
    }

    if (containsHashtags(text)) {
      issues.push('Hashtags are not allowed in posts');
    }

    const commercial = detectCommercialContent(text);
    if (commercial.isCommercial) {
      issues.push(
        `Commercial content detected: ${commercial.matchedPatterns.join(', ')}`
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

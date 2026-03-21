import crypto from 'crypto';

export interface ProcessedImage {
  original: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
  format: string;
  hash: string;
}

/**
 * Process an uploaded image:
 * - Strip EXIF data
 * - Generate a thumbnail (300x300)
 * - Hash the content for deduplication
 *
 * In production, this would use 'sharp' for actual image processing.
 * For now, we provide the interface and pass-through implementation.
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // In production: use sharp to resize, strip EXIF, generate thumbnail
  // const sharp = require('sharp');
  // const metadata = await sharp(buffer).metadata();
  // const processed = await sharp(buffer).rotate().stripMetadata().toBuffer();
  // const thumbnail = await sharp(buffer).resize(300, 300, { fit: 'cover' }).toBuffer();

  return {
    original: buffer,
    thumbnail: buffer, // Passthrough in dev
    width: 0,
    height: 0,
    format: 'unknown',
    hash,
  };
}

/**
 * Validate that a buffer is an acceptable image format.
 */
export function validateImageFormat(buffer: Buffer): { valid: boolean; format: string } {
  // Check magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return { valid: true, format: 'jpeg' };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, format: 'png' };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { valid: true, format: 'gif' };
  }
  // WebP
  if (buffer.length >= 12 && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
    return { valid: true, format: 'webp' };
  }
  return { valid: false, format: 'unknown' };
}

/**
 * Validate video format by checking magic bytes.
 */
export function validateVideoFormat(buffer: Buffer): { valid: boolean; format: string } {
  // MP4/MOV (ftyp box)
  if (buffer.length >= 8 && buffer.slice(4, 8).toString() === 'ftyp') {
    return { valid: true, format: 'mp4' };
  }
  // WebM
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return { valid: true, format: 'webm' };
  }
  return { valid: false, format: 'unknown' };
}

/**
 * Get size limits for media uploads.
 */
export const MEDIA_LIMITS = {
  maxImageSize: 10 * 1024 * 1024,  // 10MB
  maxVideoSize: 50 * 1024 * 1024,  // 50MB
  maxThumbnailDimension: 300,
  allowedImageFormats: ['jpeg', 'png', 'webp'],
  allowedVideoFormats: ['mp4', 'webm'],
} as const;

import { Router, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { config } from '../config';
import crypto from 'crypto';

const router = Router();

const s3 = new S3Client({
  region: config.s3Region,
  ...(config.s3Endpoint && {
    endpoint: config.s3Endpoint,
    forcePathStyle: true,
  }),
});

/**
 * GET /media/upload-url
 * Returns a presigned PUT URL for direct-to-storage upload.
 * Client uploads the file directly — never touches our API server.
 */
router.get(
  '/upload-url',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const ext = (req.query.ext as string) || 'jpg';
      const contentType = (req.query.contentType as string) || 'image/jpeg';

      // Validate content type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(contentType)) {
        res.status(400).json({ error: 'Unsupported content type' });
        return;
      }

      // Generate a unique key
      const key = `posts/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min expiry

      // Public URL depends on CDN/bucket config
      const mediaUrl = config.cdnUrl
        ? `${config.cdnUrl}/${key}`
        : `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${key}`;

      res.json({ uploadUrl, mediaUrl, key });
    } catch (err) {
      console.error('Error generating upload URL:', err);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  }
);

export default router;

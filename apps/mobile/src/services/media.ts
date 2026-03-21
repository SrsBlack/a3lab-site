/**
 * Media upload service.
 *
 * Flow:
 *   1. Request a presigned upload URL from the API
 *   2. Upload the file directly to cloud storage (R2/S3)
 *   3. Return the public media URL for the post
 *
 * This keeps large files off the API server entirely.
 */

import client from './api';

interface PresignedUrlResponse {
  uploadUrl: string;
  mediaUrl: string;
  key: string;
}

/**
 * Upload a local file (photo or video) to cloud storage via presigned URL.
 * Returns the public URL to reference in the post.
 */
export async function uploadMedia(
  localUri: string,
  type: 'image' | 'video'
): Promise<string> {
  // Step 1: Get a presigned upload URL from our API
  const ext = type === 'image' ? 'jpg' : 'mp4';
  const contentType = type === 'image' ? 'image/jpeg' : 'video/mp4';

  const { data } = await client.get<PresignedUrlResponse>('/media/upload-url', {
    params: { ext, contentType },
  });

  // Step 2: Read the local file and upload directly to storage
  const response = await fetch(localUri);
  const blob = await response.blob();

  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  // Step 3: Return the public URL
  return data.mediaUrl;
}

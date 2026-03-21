/**
 * Push notification service — sends Expo push notifications.
 *
 * Uses expo-server-sdk to batch and send notifications.
 * Tokens are stored on the User model (pushToken field).
 */

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../db';

const expo = new Expo();

// ─── Token management ────────────────────────────────

/**
 * Save an Expo push token for a user.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error('Invalid Expo push token');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { pushToken: token },
  });
}

// ─── Send to a single user ──────────────────────────

/**
 * Send a push notification to a single user by their userId.
 * Silently skips if the user has no push token.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (!user?.pushToken || !Expo.isExpoPushToken(user.pushToken)) {
    return;
  }

  const message: ExpoPushMessage = {
    to: user.pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    handleTicketErrors(tickets, [user.pushToken]);
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}

// ─── Notification types ─────────────────────────────

/**
 * Notify a post author that someone reacted to their post.
 * "username felt that about your post"
 */
export async function sendReactionNotification(
  postAuthorId: string,
  reactorUsername: string,
  reactionType: string,
  postId: string
): Promise<void> {
  const reactionLabel = formatReactionType(reactionType);

  await sendPushToUser(
    postAuthorId,
    'New reaction',
    `${reactorUsername} ${reactionLabel} about your post`,
    { postId }
  );
}

/**
 * Notify a user that someone vouched for them.
 * "username vouched for you! +15 trust"
 */
export async function sendVouchNotification(
  voucheeId: string,
  voucherUsername: string
): Promise<void> {
  await sendPushToUser(
    voucheeId,
    'New vouch',
    `${voucherUsername} vouched for you! +15 trust`,
    { screen: 'trust' }
  );
}

/**
 * Notify a user that their post was flagged for review.
 * "Your post was flagged for review"
 */
export async function sendModerationNotification(
  postAuthorId: string,
  postId: string
): Promise<void> {
  await sendPushToUser(
    postAuthorId,
    'Content review',
    'Your post was flagged for review',
    { postId }
  );
}

// ─── Batch support ──────────────────────────────────

/**
 * Send push notifications to multiple users at once.
 * Automatically chunks into batches per Expo's limits.
 */
export async function sendPushBatch(
  messages: ExpoPushMessage[]
): Promise<void> {
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      const tokens = chunk.map((m) => (typeof m.to === 'string' ? m.to : m.to[0]));
      handleTicketErrors(tickets, tokens);
    } catch (err) {
      console.error('Batch push notification error:', err);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────

function formatReactionType(type: string): string {
  switch (type) {
    case 'FELT_THAT':
      return 'felt that';
    case 'RESPECT':
      return 'respect';
    case 'REAL_ONE':
      return 'real one';
    default:
      return 'reacted';
  }
}

/**
 * Handle push ticket errors. If a token is invalid, remove it from the user.
 */
function handleTicketErrors(tickets: ExpoPushTicket[], tokens: string[]): void {
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];

    if (ticket.status === 'error') {
      console.error(`Push ticket error: ${ticket.message}`);

      // Remove invalid tokens so we stop trying
      if (
        ticket.details?.error === 'DeviceNotRegistered' &&
        tokens[i]
      ) {
        prisma.user
          .updateMany({
            where: { pushToken: tokens[i] },
            data: { pushToken: null },
          })
          .catch((err) => console.error('Failed to clear invalid push token:', err));
      }
    }
  }
}

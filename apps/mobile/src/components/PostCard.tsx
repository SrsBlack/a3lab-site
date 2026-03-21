import React, { useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Post, ReactionType } from '../stores/feedStore';
import { useFeedStore } from '../stores/feedStore';
import VerifiedBadge from './VerifiedBadge';
import ReactionBar from './ReactionBar';

interface PostCardProps {
  post: Post;
  onUsernamePress?: (userId: string) => void;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function PostCard({ post, onUsernamePress }: PostCardProps) {
  const toggleReaction = useFeedStore((s) => s.toggleReaction);
  const flagPost = useFeedStore((s) => s.flagPost);

  const handleReact = useCallback(
    (type: ReactionType) => {
      toggleReaction(post.id, type);
    },
    [post.id, toggleReaction]
  );

  const handleFlag = useCallback(() => {
    Alert.alert(
      'Flag this post?',
      'If this content is fake, AI-generated, or harmful, it will be reviewed by trusted community members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag It',
          style: 'destructive',
          onPress: () => flagPost(post.id),
        },
      ]
    );
  }, [post.id, flagPost]);

  const captureLabel =
    post.captureMethod === 'typed_live'
      ? 'typed live \u00B7 unedited'
      : 'captured on device';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Pressable onPress={() => onUsernamePress?.(post.authorId)}>
            <Text style={styles.username}>{post.authorUsername}</Text>
          </Pressable>
          {post.isAuthorVerified && <VerifiedBadge size="sm" />}
        </View>
        <Text style={styles.timestamp}>{getRelativeTime(post.createdAt)}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {post.contentType === 'photo' && post.mediaUrl && (
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {post.contentType === 'video' && post.mediaUrl && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlayIcon}>{'▶'}</Text>
          </View>
        )}

        {post.contentType === 'text' && post.textContent && (
          <View style={styles.textContent}>
            <Text style={styles.textBody}>{post.textContent}</Text>
          </View>
        )}

        {post.caption && (
          <Text style={styles.caption}>{post.caption}</Text>
        )}
      </View>

      {/* Capture method badge */}
      <View style={styles.metaRow}>
        <View style={styles.captureBadge}>
          <Text style={styles.captureBadgeText}>{captureLabel}</Text>
        </View>
      </View>

      {/* Reactions */}
      <View style={styles.reactionsRow}>
        <ReactionBar reactions={post.reactions} onReact={handleReact} />
      </View>

      {/* Flag — subtle */}
      <View style={styles.footer}>
        <Pressable onPress={handleFlag} hitSlop={12}>
          <Text style={styles.flagText}>flag</Text>
        </Pressable>
      </View>

      {post.flagged && (
        <View style={styles.flaggedOverlay}>
          <Text style={styles.flaggedText}>under review</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  username: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  content: {
    marginBottom: spacing.sm,
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray700,
  },
  videoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    color: colors.white,
    fontSize: 48,
    opacity: 0.7,
  },
  textContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    minHeight: 120,
    justifyContent: 'center',
  },
  textBody: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  metaRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  captureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.verifiedBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  captureBadgeText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reactionsRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  flagText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flaggedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flaggedText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

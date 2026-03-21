import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { postsAPI } from '../services/api';
import VerifiedBadge from '../components/VerifiedBadge';

interface ProfilePost {
  id: string;
  contentType: 'photo' | 'video' | 'text';
  mediaUrl: string | null;
  textContent: string | null;
  createdAt: string;
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(false);
      const res = await postsAPI.getUserPosts(user.id);
      setPosts(res.data.posts ?? []);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const renderGridItem = useCallback(
    ({ item }: { item: ProfilePost }) => (
      <Pressable style={styles.gridItem}>
        {item.contentType === 'text' ? (
          <View style={styles.textThumb}>
            <Text style={styles.textThumbBody} numberOfLines={4}>
              {item.textContent}
            </Text>
          </View>
        ) : (
          <View style={styles.mediaThumb}>
            {item.mediaUrl ? (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={styles.thumbIcon}>
                  {item.contentType === 'video' ? '▶' : '◻'}
                </Text>
              </View>
            )}
            {item.contentType === 'video' && (
              <View style={styles.videoOverlay}>
                <Text style={styles.videoOverlayIcon}>▶</Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>
            {user?.username ?? 'anonymous'}
          </Text>
          {user?.isVerified && <VerifiedBadge size="md" />}
        </View>

        <Text style={styles.memberSince}>
          member since{' '}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })
            : '---'}
        </Text>

        <Text style={styles.postCount}>
          {posts.length} moment{posts.length !== 1 ? 's' : ''} captured
        </Text>
      </View>

      {/* Post grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>couldn't load posts</Text>
          <Text style={styles.emptyBody}>
            check your connection and try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={loadPosts}>
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>nothing yet</Text>
          <Text style={styles.emptyBody}>
            capture your first unfiltered moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  username: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  memberSince: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  postCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  grid: {
    padding: 1,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  mediaThumb: {
    flex: 1,
    backgroundColor: colors.gray700,
  },
  thumbImage: {
    flex: 1,
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    color: colors.textMuted,
    fontSize: 24,
  },
  videoOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  videoOverlayIcon: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.8,
  },
  textThumb: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textThumbBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});

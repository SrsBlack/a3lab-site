import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useFeedStore, Post } from '../stores/feedStore';
import { feedAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { SkeletonPostCard } from '../components/Skeleton';

export default function FeedScreen() {
  const {
    posts,
    isLoading,
    isRefreshing,
    cursor,
    hasMore,
    setPosts,
    appendPosts,
    setLoading,
    setRefreshing,
  } = useFeedStore();

  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await feedAPI.getFeed(undefined, 20);
      setPosts(res.data.posts ?? []);
    } catch {
      if (posts.length === 0) {
        setError('could not load feed. check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [setPosts, setLoading, posts.length]);

  const refreshFeed = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await feedAPI.getFeed(undefined, 20);
      setPosts(res.data.posts ?? []);
    } catch {
      // Keep existing posts on refresh failure
    } finally {
      setRefreshing(false);
    }
  }, [setPosts, setRefreshing]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursor) return;
    try {
      const res = await feedAPI.getFeed(cursor, 20);
      appendPosts(res.data.posts ?? [], res.data.cursor ?? null);
    } catch {
      // Silently fail on pagination
    }
  }, [hasMore, isLoading, cursor, appendPosts]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => <PostCard post={item} />,
    []
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View>
          {[1, 2, 3].map((i) => (
            <SkeletonPostCard key={i} />
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>offline</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadFeed}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>nothing here yet</Text>
        <Text style={styles.emptyBody}>
          follow real people to see their unfiltered moments.{'\n'}
          or capture something yourself.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || posts.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.textMuted} size="small" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>PROOF</Text>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshFeed}
            tintColor={colors.textMuted}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      />
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 4,
  },
  emptyList: {
    flex: 1,
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
    textTransform: 'lowercase',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
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

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { useFeedStore, Post } from '../stores/feedStore';
import { feedAPI } from '../services/api';
import PostCard from '../components/PostCard';

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

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await feedAPI.getFeed(undefined, 20);
      setPosts(res.data.posts ?? []);
    } catch {
      // Network error — keep existing posts
    } finally {
      setLoading(false);
    }
  }, [setPosts, setLoading]);

  const refreshFeed = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await feedAPI.getFeed(undefined, 20);
      setPosts(res.data.posts ?? []);
    } catch {
      // Silently fail
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
      // Silently fail
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
    if (isLoading) return null;
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
});

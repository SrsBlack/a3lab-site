import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { bookmarksAPI } from '../services/api';

interface BookmarkedPost {
  id: string;
  contentType: 'photo' | 'video' | 'text';
  mediaUrl: string | null;
  textBody: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    isVerified: boolean;
  };
}

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await bookmarksAPI.list();
      setBookmarks(res.data.bookmarks ?? []);
    } catch {
      // keep existing
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (postId: string) => {
    try {
      await bookmarksAPI.remove(postId);
      setBookmarks((prev) => prev.filter((b) => b.id !== postId));
    } catch {
      // silently fail
    }
  };

  const renderItem = ({ item }: { item: BookmarkedPost }) => (
    <View style={styles.row}>
      <View style={styles.thumbContainer}>
        {item.contentType === 'text' ? (
          <View style={styles.textThumb}>
            <Text style={styles.textThumbBody} numberOfLines={3}>
              {item.textBody}
            </Text>
          </View>
        ) : item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>
              {item.contentType === 'video' ? '▶' : '◻'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowUsername}>{item.author.username}</Text>
        <Text style={styles.rowDate}>
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>
      <Pressable onPress={() => handleRemove(item.id)} hitSlop={8}>
        <Text style={styles.removeText}>remove</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BOOKMARKS</Text>
      </View>

      {isLoading && bookmarks.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                no bookmarks yet
              </Text>
              <Text style={styles.emptySubtext}>
                save moments you want to revisit
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            bookmarks.length === 0 ? styles.emptyList : undefined
          }
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
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbContainer: {
    width: 56,
    height: 56,
    marginRight: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    backgroundColor: colors.gray700,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    color: colors.textMuted,
    fontSize: 18,
  },
  textThumb: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textThumbBody: {
    color: colors.textSecondary,
    fontSize: 8,
  },
  rowInfo: {
    flex: 1,
  },
  rowUsername: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  rowDate: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  removeText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

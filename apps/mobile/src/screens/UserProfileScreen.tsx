import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { socialAPI, postsAPI, profileAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import VerifiedBadge from '../components/VerifiedBadge';

interface UserProfile {
  id: string;
  username: string;
  isVerified: boolean;
  joinedAt: string;
  postCount: number;
  vouchCount: number;
  isFollowing: boolean;
  hasVouched: boolean;
}

interface UserPost {
  id: string;
  contentType: 'photo' | 'video' | 'text';
  mediaUrl: string | null;
  textBody: string | null;
  createdAt: string;
}

export default function UserProfileScreen({ route }: any) {
  const userId = route?.params?.userId;
  const myId = useAuthStore((s) => s.user?.id);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(false);
      const [profileRes, postsRes] = await Promise.all([
        socialAPI.getProfile(userId),
        postsAPI.getUserPosts(userId),
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data.posts ?? []);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await socialAPI.unfollow(profile.id);
        setProfile({ ...profile, isFollowing: false });
      } else {
        await socialAPI.follow(profile.id);
        setProfile({ ...profile, isFollowing: true });
      }
    } catch {
      Alert.alert('Error', 'Could not update follow status.');
    }
  };

  const handleBlock = () => {
    if (!profile) return;
    Alert.alert(
      'Block this user?',
      'They won\'t be able to see your posts or interact with you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileAPI.block(profile.id);
              Alert.alert('Blocked', 'User has been blocked.');
            } catch {
              Alert.alert('Error', 'Could not block user.');
            }
          },
        },
      ]
    );
  };

  const renderGridItem = useCallback(
    ({ item }: { item: UserPost }) => (
      <Pressable style={styles.gridItem}>
        {item.contentType === 'text' ? (
          <View style={styles.textThumb}>
            <Text style={styles.textThumbBody} numberOfLines={4}>
              {item.textBody}
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
          </View>
        )}
      </Pressable>
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>couldn't load profile</Text>
        <Pressable style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryText}>RETRY</Text>
        </Pressable>
      </View>
    );
  }

  const isOwnProfile = myId === profile.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.username}>{profile.username}</Text>
          {profile.isVerified && <VerifiedBadge size="md" />}
        </View>

        <Text style={styles.memberSince}>
          member since{' '}
          {new Date(profile.joinedAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </Text>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            {profile.postCount} moment{profile.postCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.stat}>
            {profile.vouchCount} vouch{profile.vouchCount !== 1 ? 'es' : ''}
          </Text>
        </View>

        {!isOwnProfile && (
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.actionButton,
                profile.isFollowing && styles.actionButtonActive,
              ]}
              onPress={handleFollow}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  profile.isFollowing && styles.actionButtonTextActive,
                ]}
              >
                {profile.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
              </Text>
            </Pressable>

            <Pressable style={styles.blockButton} onPress={handleBlock}>
              <Text style={styles.blockButtonText}>BLOCK</Text>
            </Pressable>
          </View>
        )}
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>no moments yet</Text>
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  statDivider: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  actionButtonActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  actionButtonTextActive: {
    color: colors.textSecondary,
  },
  blockButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  blockButtonText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  retryButton: {
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

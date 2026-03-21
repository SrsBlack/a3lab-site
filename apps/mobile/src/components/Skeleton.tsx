import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width,
  height,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.gray700,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonPostCard() {
  return (
    <View style={styles.postCard}>
      {/* Header: username + badge | timestamp */}
      <View style={styles.postHeader}>
        <View style={styles.postAuthorRow}>
          <Skeleton width={100} height={14} />
          <Skeleton width={20} height={14} borderRadius={borderRadius.xs} />
        </View>
        <Skeleton width={24} height={10} />
      </View>

      {/* Content area — square aspect ratio */}
      <Skeleton
        width="100%"
        height="auto"
        borderRadius={0}
        style={{ aspectRatio: 1 }}
      />

      {/* Reaction bar — 3 buttons */}
      <View style={styles.postReactions}>
        <View style={styles.reactionSlot}>
          <Skeleton width="100%" height={34} borderRadius={borderRadius.sm} />
        </View>
        <View style={styles.reactionSlot}>
          <Skeleton width="100%" height={34} borderRadius={borderRadius.sm} />
        </View>
        <View style={styles.reactionSlot}>
          <Skeleton width="100%" height={34} borderRadius={borderRadius.sm} />
        </View>
      </View>

      {/* Flag placeholder */}
      <View style={styles.postFooter}>
        <Skeleton width={48} height={10} />
      </View>
    </View>
  );
}

export function SkeletonProfileHeader() {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileRow}>
        <Skeleton width={120} height={18} />
        <Skeleton width={20} height={18} borderRadius={borderRadius.xs} />
      </View>
      <Skeleton width={100} height={12} />
      <Skeleton width={80} height={12} />
    </View>
  );
}

export function SkeletonTrustScore() {
  return (
    <View style={styles.trustScore}>
      <Skeleton width={80} height={12} />
      <Skeleton width={48} height={32} />
      <Skeleton width="100%" height={6} borderRadius={borderRadius.full} />
    </View>
  );
}

const styles = StyleSheet.create({
  // SkeletonPostCard
  postCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  postReactions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  reactionSlot: {
    flex: 1,
  },
  postFooter: {
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },

  // SkeletonProfileHeader
  profileHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // SkeletonTrustScore
  trustScore: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({ size = 'sm' }: VerifiedBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, isSmall ? styles.badgeSm : styles.badgeMd]}>
      <Text style={[styles.check, isSmall ? styles.checkSm : styles.checkMd]}>
        ✓
      </Text>
      {!isSmall && <Text style={styles.label}>human verified</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.verifiedBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeSm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  badgeMd: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  check: {
    color: colors.verified,
    fontWeight: typography.fontWeight.bold,
  },
  checkSm: {
    fontSize: typography.fontSize.xs,
  },
  checkMd: {
    fontSize: typography.fontSize.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

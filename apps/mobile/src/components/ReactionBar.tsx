import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { ReactionType, Reaction } from '../stores/feedStore';

interface ReactionBarProps {
  reactions: Reaction[];
  onReact: (type: ReactionType) => void;
}

const REACTION_LABELS: Record<ReactionType, string> = {
  felt_that: 'felt that',
  respect: 'respect',
  real_one: 'real one',
};

function ReactionButton({
  reaction,
  onPress,
}: {
  reaction: Reaction;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    // Quick pop animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Pressable onPress={handlePress} style={styles.reactionButton}>
      <Animated.View
        style={[
          styles.reactionInner,
          reaction.hasReacted && styles.reactionActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.reactionLabel,
            reaction.hasReacted && styles.reactionLabelActive,
          ]}
        >
          {REACTION_LABELS[reaction.type]}
        </Text>
        {reaction.count > 0 && (
          <Text
            style={[
              styles.reactionCount,
              reaction.hasReacted && styles.reactionCountActive,
            ]}
          >
            {reaction.count}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function ReactionBar({ reactions, onReact }: ReactionBarProps) {
  return (
    <View style={styles.container}>
      {reactions.map((reaction) => (
        <ReactionButton
          key={reaction.type}
          reaction={reaction}
          onPress={() => onReact(reaction.type)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reactionButton: {
    flex: 1,
  },
  reactionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  reactionActive: {
    borderColor: colors.reactionActive,
    backgroundColor: colors.surfaceElevated,
  },
  reactionLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  reactionLabelActive: {
    color: colors.reactionActive,
  },
  reactionCount: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  reactionCountActive: {
    color: colors.textSecondary,
  },
});

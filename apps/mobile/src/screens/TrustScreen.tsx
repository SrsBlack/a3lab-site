import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { trustAPI } from '../services/api';

interface TrustCheck {
  name: string;
  passed: boolean;
  weight: number;
}

export default function TrustScreen() {
  const user = useAuthStore((s) => s.user);
  const updateTrustScore = useAuthStore((s) => s.updateTrustScore);
  const [checks, setChecks] = useState<TrustCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vouchPhone, setVouchPhone] = useState('');

  const [error, setError] = useState(false);

  const loadBreakdown = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(false);
      const res = await trustAPI.getBreakdown();
      setChecks(res.data.checks ?? []);
      if (res.data.score !== undefined) {
        updateTrustScore(res.data.score);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [updateTrustScore]);

  useEffect(() => {
    loadBreakdown();
  }, [loadBreakdown]);

  const handleSelfieChallenge = useCallback(() => {
    Alert.alert(
      'Selfie Challenge',
      'You\'ll need to take a live selfie matching a random pose. This verifies you\'re a real human.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Challenge',
          onPress: () => {
            // In production: navigate to liveness camera
          },
        },
      ]
    );
  }, []);

  const handleInviteVouch = useCallback(async () => {
    if (!vouchPhone.trim()) return;
    try {
      await trustAPI.requestVouch(vouchPhone.trim());
      Alert.alert('Vouch requested', 'We sent them an invite. If they vouch for you, your trust score goes up.');
      setVouchPhone('');
    } catch {
      Alert.alert('Failed', 'Could not send vouch request.');
    }
  }, [vouchPhone]);

  const trustScore = user?.trustScore ?? 0;
  const canModerate = trustScore >= 75;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>couldn't load trust data</Text>
        <Text style={styles.errorBody}>check your connection</Text>
        <Pressable style={styles.retryButton} onPress={loadBreakdown}>
          <Text style={styles.retryText}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Private notice */}
      <View style={styles.privateNotice}>
        <Text style={styles.privateText}>
          your score is private. others only see ✓ verified.
        </Text>
      </View>

      {/* Trust score */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>YOUR TRUST SCORE</Text>
        <Text style={styles.scoreValue}>{trustScore}</Text>
        <View style={styles.scoreBar}>
          <View
            style={[styles.scoreBarFill, { width: `${trustScore}%` }]}
          />
        </View>
        <View style={styles.scoreScale}>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>100</Text>
        </View>
      </View>

      {/* Checks breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VERIFICATION CHECKS</Text>
        {checks.length > 0 ? (
          checks.map((check, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={styles.checkStatus}>
                <Text
                  style={[
                    styles.checkIcon,
                    check.passed ? styles.checkPassed : styles.checkFailed,
                  ]}
                >
                  {check.passed ? '✓' : '○'}
                </Text>
              </View>
              <View style={styles.checkInfo}>
                <Text style={styles.checkName}>{check.name}</Text>
                <Text style={styles.checkWeight}>+{check.weight} pts</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.checksEmpty}>
            <Text style={styles.checksEmptyRow}>○  phone verification</Text>
            <Text style={styles.checksEmptyRow}>○  liveness selfie</Text>
            <Text style={styles.checksEmptyRow}>○  community vouch</Text>
            <Text style={styles.checksEmptyRow}>○  consistent activity</Text>
            <Text style={styles.checksEmptyRow}>○  device integrity</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INCREASE YOUR TRUST</Text>

        <Pressable style={styles.actionButton} onPress={handleSelfieChallenge}>
          <Text style={styles.actionTitle}>Complete Selfie Challenge</Text>
          <Text style={styles.actionDesc}>
            Prove you're human with a live selfie matching a random pose.
          </Text>
        </Pressable>

        <View style={styles.vouchSection}>
          <Text style={styles.actionTitle}>Invite a Friend to Vouch</Text>
          <Text style={styles.actionDesc}>
            Real people vouch for real people. Ask someone who knows you.
          </Text>
          <View style={styles.vouchInputRow}>
            <TextInput
              style={styles.vouchInput}
              placeholder="their phone number"
              placeholderTextColor={colors.textMuted}
              value={vouchPhone}
              onChangeText={setVouchPhone}
              keyboardType="phone-pad"
            />
            <Pressable
              style={[
                styles.vouchButton,
                !vouchPhone.trim() && styles.vouchButtonDisabled,
              ]}
              onPress={handleInviteVouch}
              disabled={!vouchPhone.trim()}
            >
              <Text style={styles.vouchButtonText}>SEND</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Moderation */}
      {canModerate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMUNITY MODERATION</Text>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionTitle}>Review Flagged Content</Text>
            <Text style={styles.actionDesc}>
              Your trust score qualifies you to help keep PROOF authentic.
            </Text>
          </Pressable>
        </View>
      )}

      {!canModerate && (
        <View style={styles.section}>
          <View style={styles.moderationLocked}>
            <Text style={styles.moderationLockedText}>
              community moderation unlocks at trust score 75
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  privateNotice: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  privateText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scoreSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    color: colors.text,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
    marginBottom: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  scoreBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray700,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  scoreScale: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scaleText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkStatus: {
    width: 32,
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  checkPassed: {
    color: colors.white,
  },
  checkFailed: {
    color: colors.textMuted,
  },
  checkInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkName: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  checkWeight: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  checksEmpty: {
    gap: spacing.sm,
  },
  checksEmptyRow: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.xs,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  actionDesc: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  vouchSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
  },
  vouchInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  vouchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  vouchButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vouchButtonDisabled: {
    opacity: 0.3,
  },
  vouchButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  moderationLocked: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  moderationLockedText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'lowercase',
    letterSpacing: 0.3,
  },
  errorTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
    textTransform: 'lowercase',
  },
  errorBody: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
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

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { notificationsAPI } from '../services/api';

export default function SettingsScreen() {
  const { settings, loadSettings, updateSetting } = useSettingsStore();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    try {
      await notificationsAPI.updatePreferences({ [key]: value });
    } catch {
      // Revert on failure
      updateSetting(key, !value);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You can always log back in with your phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Reactions</Text>
            <Text style={styles.settingDescription}>
              when someone reacts to your posts
            </Text>
          </View>
          <Switch
            value={settings.notifyReactions}
            onValueChange={(v) => handleToggle('notifyReactions', v)}
            trackColor={{ false: colors.gray600, true: colors.gray300 }}
            thumbColor={settings.notifyReactions ? colors.white : colors.gray400}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vouches</Text>
            <Text style={styles.settingDescription}>
              when someone vouches for you
            </Text>
          </View>
          <Switch
            value={settings.notifyVouches}
            onValueChange={(v) => handleToggle('notifyVouches', v)}
            trackColor={{ false: colors.gray600, true: colors.gray300 }}
            thumbColor={settings.notifyVouches ? colors.white : colors.gray400}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Moderation</Text>
            <Text style={styles.settingDescription}>
              updates about flagged content
            </Text>
          </View>
          <Switch
            value={settings.notifyModeration}
            onValueChange={(v) => handleToggle('notifyModeration', v)}
            trackColor={{ false: colors.gray600, true: colors.gray300 }}
            thumbColor={
              settings.notifyModeration ? colors.white : colors.gray400
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <Pressable style={styles.dangerRow} onPress={handleLogout}>
          <Text style={styles.dangerText}>LOG OUT</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PROOF</Text>
        <Text style={styles.footerSubtext}>
          real people. real moments. no filter.
        </Text>
      </View>
    </ScrollView>
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
  section: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  dangerRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dangerText: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 4,
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});

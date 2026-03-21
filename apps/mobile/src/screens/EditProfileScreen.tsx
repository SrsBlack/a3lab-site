import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { profileAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function EditProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [displayName, setDisplayName] = useState(
    (user as any)?.displayName ?? ''
  );
  const [bio, setBio] = useState((user as any)?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await profileAPI.update({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation?.goBack?.();
    } catch {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DISPLAY NAME</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="your name"
          placeholderTextColor={colors.textMuted}
          maxLength={50}
          autoCapitalize="words"
        />
        <Text style={styles.charCount}>{displayName.length}/50</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>BIO</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="say something real"
          placeholderTextColor={colors.textMuted}
          maxLength={160}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/160</Text>
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveText}>
          {isSaving ? 'SAVING...' : 'SAVE'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => navigation?.goBack?.()}
      >
        <Text style={styles.cancelText}>CANCEL</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 4,
  },
  field: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  input: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 80,
    borderBottomWidth: 1,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  saveButton: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: colors.black,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  cancelButton: {
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { authAPI } from '../../services/api';

interface WelcomeScreenProps {
  onPhoneSubmit: (phone: string) => void;
}

export default function WelcomeScreen({ onPhoneSubmit }: WelcomeScreenProps) {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length < 10) {
      setError('enter a valid phone number');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await authAPI.requestOTP(cleaned);
      onPhoneSubmit(cleaned);
    } catch {
      setError('something went wrong. try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.brandSection}>
          <Text style={styles.logo}>PROOF</Text>
          <Text style={styles.tagline}>
            Real people. Real moments. No filter.
          </Text>
        </View>

        {/* Phone input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>enter your phone number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="+1 (555) 000-0000"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setError(null);
            }}
            keyboardType="phone-pad"
            autoFocus
            textContentType="telephoneNumber"
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Submit */}
        <Pressable
          style={[
            styles.submitButton,
            (!phone.trim() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!phone.trim() || isSubmitting}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'SENDING...' : 'CONTINUE'}
          </Text>
        </Pressable>

        {/* Manifesto */}
        <View style={styles.manifesto}>
          <Text style={styles.manifestoText}>
            This isn't another social app.{'\n'}
            There are no filters. No edits. No AI.{'\n'}
            Just you.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    color: colors.text,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  phoneInput: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray600,
    paddingVertical: spacing.md,
    letterSpacing: 1,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.3,
  },
  submitText: {
    color: colors.black,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 3,
  },
  manifesto: {
    alignItems: 'center',
  },
  manifestoText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    fontStyle: 'italic',
  },
});

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface VerifyScreenProps {
  phone: string;
  onBack: () => void;
}

type VerifyStep = 'code' | 'liveness';

export default function VerifyScreen({ phone, onBack }: VerifyScreenProps) {
  const [step, setStep] = useState<VerifyStep>('code');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLivenessReady, setIsLivenessReady] = useState(false);

  const login = useAuthStore((s) => s.login);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const livenessCameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const handleCodeChange = useCallback(
    (text: string, index: number) => {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Auto-advance to next input
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits entered
      if (index === 5 && text) {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          handleVerifyCode(fullCode);
        }
      }
    },
    [code]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handleVerifyCode = async (fullCode: string) => {
    setIsVerifying(true);
    try {
      const res = await authAPI.verifyOTP(phone, fullCode);
      const { token, user } = res.data;

      if (user.isVerified) {
        // Already verified — go straight in
        login(token, user);
      } else {
        // Need liveness check
        login(token, user); // Store token for liveness API call
        setStep('liveness');
      }
    } catch {
      Alert.alert('Invalid code', 'That code didn\'t work. Try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLivenessCapture = useCallback(async () => {
    if (!livenessCameraRef.current) return;

    setIsLivenessReady(true);

    try {
      // Capture a real selfie from the front camera
      const photo = await livenessCameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture selfie');
      }

      // Submit the base64-encoded selfie to the server
      await authAPI.submitLiveness(photo.base64);

      // Auth store already has token — update user verification status
      const res = await authAPI.getMe();
      if (res.data?.user) {
        login(useAuthStore.getState().token!, res.data.user);
      }
    } catch {
      Alert.alert(
        'Verification failed',
        'We couldn\'t verify your selfie. Make sure your face is clearly visible and try again.'
      );
      setIsLivenessReady(false);
    }
  }, [login]);

  // ─── Liveness step ─────────────────────────────────

  if (step === 'liveness') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
            <Text style={styles.stepTitle}>prove you're human</Text>
            <Text style={styles.stepDesc}>
              Take a live selfie. No filters, no saved photos.{'\n'}
              This confirms a real person is behind this account.
            </Text>
          </View>

          {/* Live front camera for selfie */}
          <View style={styles.livenessCamera}>
            {cameraPermission?.granted ? (
              <View style={styles.livenessViewfinder}>
                <CameraView
                  ref={livenessCameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="front"
                  mode="picture"
                />
                <View style={styles.faceOutline} />
                <Text style={styles.livenessHint}>
                  position your face in the circle
                </Text>
              </View>
            ) : (
              <Pressable style={styles.livenessViewfinder} onPress={requestCameraPermission}>
                <Text style={styles.livenessHint}>
                  tap to enable camera
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              styles.livenessButton,
              isLivenessReady && styles.livenessButtonDisabled,
            ]}
            onPress={handleLivenessCapture}
            disabled={isLivenessReady}
          >
            <Text style={styles.livenessButtonText}>
              {isLivenessReady ? 'VERIFYING...' : 'TAKE SELFIE'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Code verification step ─────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>{'< back'}</Text>
        </Pressable>

        <View style={styles.stepHeader}>
          <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
          <Text style={styles.stepTitle}>enter your code</Text>
          <Text style={styles.stepDesc}>
            we sent a 6-digit code to{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        {/* Code inputs */}
        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
              ]}
              value={digit}
              onChangeText={(t) => handleCodeChange(t.slice(-1), i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {isVerifying && (
          <Text style={styles.verifyingText}>verifying...</Text>
        )}

        <Pressable style={styles.resendButton}>
          <Text style={styles.resendText}>didn't get a code? resend</Text>
        </Pressable>
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
  backButton: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.lg,
    zIndex: 1,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textTransform: 'lowercase',
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  phoneHighlight: {
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
  },

  // ─── Code input ───────────────────────────────────
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.gray600,
    borderRadius: borderRadius.sm,
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: colors.white,
    backgroundColor: colors.surfaceElevated,
  },
  verifyingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },

  // ─── Liveness ─────────────────────────────────────
  livenessCamera: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  livenessViewfinder: {
    width: 240,
    height: 300,
    backgroundColor: colors.gray700,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  faceOutline: {
    width: 160,
    height: 200,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.gray400,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  livenessHint: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'lowercase',
  },
  livenessButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  livenessButtonDisabled: {
    opacity: 0.5,
  },
  livenessButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
  },
});

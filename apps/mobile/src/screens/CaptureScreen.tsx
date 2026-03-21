import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { createIntegrityPayload, startCaptureSession } from '../services/integrity';
import { postsAPI } from '../services/api';
import { useFeedStore } from '../stores/feedStore';

type CaptureMode = 'photo' | 'video' | 'text';
type CaptureState = 'ready' | 'recording' | 'preview';

export default function CaptureScreen() {
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [captureState, setCaptureState] = useState<CaptureState>('ready');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [typingStarted, setTypingStarted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prependPost = useFeedStore((s) => s.prependPost);

  // Start recording pulse animation
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const handleCapture = useCallback(() => {
    if (mode === 'photo') {
      // In production: trigger expo-camera capture
      startCaptureSession();
      setCapturedData('photo_placeholder');
      setCaptureState('preview');
    } else if (mode === 'video') {
      if (!isRecording) {
        startCaptureSession();
        setIsRecording(true);
        setCaptureState('recording');
        startPulse();
      } else {
        setIsRecording(false);
        setCaptureState('preview');
        setCapturedData('video_placeholder');
        stopPulse();
      }
    }
  }, [mode, isRecording, startPulse, stopPulse]);

  const handleTextSubmit = useCallback(() => {
    if (textContent.trim().length === 0) return;
    startCaptureSession();
    setCapturedData(textContent);
    setCaptureState('preview');
  }, [textContent]);

  const handlePostRaw = useCallback(async () => {
    if (!capturedData) return;

    setIsPosting(true);
    try {
      const integrity = await createIntegrityPayload(capturedData);

      const payload = {
        contentType: mode,
        textContent: mode === 'text' ? capturedData : undefined,
        caption: caption.trim() || undefined,
        integrityHash: integrity.hash,
        captureMeta: integrity.meta,
        signature: integrity.signature,
      };

      const res = await postsAPI.create(payload);
      if (res.data?.post) {
        prependPost(res.data.post);
      }

      // Reset
      setCaptureState('ready');
      setCapturedData(null);
      setCaption('');
      setTextContent('');
      setTypingStarted(false);
    } catch {
      Alert.alert('Failed to post', 'Something went wrong. Try again.');
    } finally {
      setIsPosting(false);
    }
  }, [capturedData, mode, caption, prependPost]);

  const handleDiscard = useCallback(() => {
    setCaptureState('ready');
    setCapturedData(null);
    setCaption('');
    setTextContent('');
    setTypingStarted(false);
    setIsRecording(false);
    stopPulse();
  }, [stopPulse]);

  // ─── Preview state ──────────────────────────────────

  if (captureState === 'preview') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.previewContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.previewTitle}>raw & unfiltered</Text>

          {mode === 'text' ? (
            <View style={styles.textPreview}>
              <Text style={styles.textPreviewBody}>{capturedData}</Text>
              <Text style={styles.typedLiveLabel}>typed live · unedited</Text>
            </View>
          ) : (
            <View style={styles.mediaPreview}>
              <View style={styles.mediaPreviewPlaceholder}>
                <Text style={styles.mediaPreviewIcon}>
                  {mode === 'photo' ? '◻' : '▶'}
                </Text>
              </View>
              <Text style={styles.capturedLabel}>captured on device</Text>
            </View>
          )}

          {/* Optional caption */}
          <TextInput
            style={styles.captionInput}
            placeholder="add a caption (optional)"
            placeholderTextColor={colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            maxLength={280}
            multiline
          />

          {/* Post it raw */}
          <Pressable
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            onPress={handlePostRaw}
            disabled={isPosting}
          >
            <Text style={styles.postButtonText}>
              {isPosting ? 'POSTING...' : 'POST IT RAW'}
            </Text>
          </Pressable>

          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardText}>discard</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Text mode ──────────────────────────────────────

  if (mode === 'text') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.textModeContainer}>
          <View style={styles.modeRow}>
            {renderModeButton('photo', mode, setMode)}
            {renderModeButton('video', mode, setMode)}
            {renderModeButton('text', mode, setMode)}
          </View>

          <View style={styles.textInputArea}>
            {typingStarted && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>typing live</Text>
              </View>
            )}
            <TextInput
              style={styles.rawTextInput}
              placeholder="say something real"
              placeholderTextColor={colors.textMuted}
              value={textContent}
              onChangeText={(t) => {
                setTextContent(t);
                if (!typingStarted && t.length > 0) setTypingStarted(true);
              }}
              multiline
              autoFocus
              maxLength={500}
            />
            <Text style={styles.charCount}>{textContent.length}/500</Text>
          </View>

          {textContent.trim().length > 0 && (
            <Pressable style={styles.doneButton} onPress={handleTextSubmit}>
              <Text style={styles.doneButtonText}>DONE</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── Camera mode (photo / video) ───────────────────

  return (
    <View style={styles.container}>
      {/* Camera viewfinder area */}
      <View style={styles.viewfinder}>
        <Text style={styles.viewfinderText}>
          {mode === 'photo' ? 'point & shoot' : 'point & record'}
        </Text>
        <Text style={styles.viewfinderSub}>
          no filters. no edits. what you see is what they get.
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Mode toggles */}
        <View style={styles.modeRow}>
          {renderModeButton('photo', mode, setMode)}
          {renderModeButton('video', mode, setMode)}
          {renderModeButton('text', mode, setMode)}
        </View>

        {/* Capture button */}
        <View style={styles.captureRow}>
          <Animated.View
            style={[
              styles.captureOuter,
              isRecording && styles.captureOuterRecording,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Pressable
              style={[
                styles.captureInner,
                isRecording && styles.captureInnerRecording,
              ]}
              onPress={handleCapture}
            >
              {isRecording && <View style={styles.stopSquare} />}
            </Pressable>
          </Animated.View>
        </View>

        {isRecording && (
          <View style={styles.recordingRow}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>recording</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function renderModeButton(
  target: CaptureMode,
  current: CaptureMode,
  setMode: (m: CaptureMode) => void
) {
  const active = target === current;
  return (
    <Pressable
      key={target}
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={() => setMode(target)}
    >
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
        {target}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ─── Viewfinder ───────────────────────────────────
  viewfinder: {
    flex: 1,
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewfinderText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'lowercase',
  },
  viewfinderSub: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // ─── Controls ─────────────────────────────────────
  controls: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeButtonActive: {
    borderColor: colors.text,
    backgroundColor: colors.surfaceElevated,
  },
  modeLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modeLabelActive: {
    color: colors.text,
  },

  // ─── Capture button ──────────────────────────────
  captureRow: {
    marginVertical: spacing.lg,
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.captureRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuterRecording: {
    borderColor: colors.captureRingRecording,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerRecording: {
    backgroundColor: colors.captureRingRecording,
  },
  stopSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.white,
  },

  // ─── Recording indicator ─────────────────────────
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.liveIndicator,
  },
  recordingText: {
    color: colors.liveIndicator,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ─── Text mode ────────────────────────────────────
  textModeContainer: {
    flex: 1,
    paddingTop: spacing.xxl,
  },
  textInputArea: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  rawTextInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.regular,
    textAlignVertical: 'top',
    lineHeight: typography.fontSize.xl * typography.lineHeight.relaxed,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.liveIndicator,
  },
  liveText: {
    color: colors.liveIndicator,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textAlign: 'right',
    paddingBottom: spacing.sm,
  },
  doneButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  doneButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
  },

  // ─── Preview ──────────────────────────────────────
  previewContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  previewTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  textPreview: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  textPreviewBody: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
    marginBottom: spacing.sm,
  },
  typedLiveLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaPreview: {
    marginBottom: spacing.md,
  },
  mediaPreviewPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  mediaPreviewIcon: {
    color: colors.textMuted,
    fontSize: 64,
  },
  capturedLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  captionInput: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.black,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 3,
  },
  discardButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  discardText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textTransform: 'lowercase',
  },
});

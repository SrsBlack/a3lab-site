import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { feedAPI, commentsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import PostCard from '../components/PostCard';
import VerifiedBadge from '../components/VerifiedBadge';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    isVerified: boolean;
  };
}

export default function PostDetailScreen({ route }: any) {
  const postId = route?.params?.postId;
  const myId = useAuthStore((s) => s.user?.id);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        feedAPI.getPost(postId),
        commentsAPI.getComments(postId),
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data.comments ?? []);
    } catch {
      // handled by empty state
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !postId || isSending) return;
    try {
      setIsSending(true);
      const res = await commentsAPI.addComment(postId, trimmed);
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch {
      // Silently fail
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // Silently fail
    }
  };

  function getRelativeTime(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentRow}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthorRow}>
          <Text style={styles.commentAuthor}>{item.author.username}</Text>
          {item.author.isVerified && <VerifiedBadge size="sm" />}
        </View>
        <Text style={styles.commentTime}>{getRelativeTime(item.createdAt)}</Text>
      </View>
      <Text style={styles.commentBody}>{item.body}</Text>
      {item.author.id === myId && (
        <Pressable
          onPress={() => handleDeleteComment(item.id)}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>delete</Text>
        </Pressable>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          post ? (
            <View style={styles.postWrapper}>
              <PostCard post={post} />
              <View style={styles.commentCountRow}>
                <Text style={styles.commentCount}>
                  {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>no comments yet</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="add a comment..."
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          maxLength={500}
          multiline
        />
        <Pressable
          style={[
            styles.sendButton,
            (!commentText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
        >
          <Text style={styles.sendText}>
            {isSending ? '...' : 'POST'}
          </Text>
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentCountRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentCount: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentAuthor: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  commentTime: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  commentBody: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  emptyComments: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.sm,
    maxHeight: 80,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
  sendText: {
    color: colors.black,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});

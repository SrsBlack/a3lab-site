import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { notificationsAPI } from '../services/api';
import {
  useNotificationStore,
  AppNotification,
} from '../stores/notificationStore';

export default function NotificationsScreen() {
  const {
    notifications,
    isLoading,
    setNotifications,
    markRead,
    markAllRead,
    setLoading,
  } = useNotificationStore();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      setNotifications(res.data.notifications ?? []);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      markAllRead();
    } catch {
      // silently fail
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      try {
        await notificationsAPI.markRead(item.id);
        markRead(item.id);
      } catch {
        // silently fail
      }
    }
  };

  function getRelativeTime(dateStr: string): string {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <Text style={styles.time}>{getRelativeTime(item.createdAt)}</Text>
    </Pressable>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} hitSlop={8}>
            <Text style={styles.markAllText}>mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>no notifications yet</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: {
    backgroundColor: colors.surfaceElevated,
  },
  rowContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xxs,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  time: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});

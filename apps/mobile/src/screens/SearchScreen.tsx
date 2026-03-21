import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { searchAPI } from '../services/api';
import { useSearchStore, SearchResult } from '../stores/searchStore';
import VerifiedBadge from '../components/VerifiedBadge';

export default function SearchScreen({ navigation }: any) {
  const { query, results, isSearching, setQuery, setResults, setSearching, clear } =
    useSearchStore();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (text.trim().length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const res = await searchAPI.users(text.trim());
          setResults(res.data.users ?? []);
        } catch {
          // keep existing results
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [setQuery, setResults, setSearching]
  );

  const renderResult = ({ item }: { item: SearchResult }) => (
    <Pressable
      style={styles.resultRow}
      onPress={() =>
        navigation?.navigate?.('UserProfile', { userId: item.id })
      }
    >
      <View style={styles.resultInfo}>
        <View style={styles.resultNameRow}>
          <Text style={styles.resultUsername}>{item.username}</Text>
          {item.isVerified && <VerifiedBadge size="sm" />}
        </View>
        <Text style={styles.resultMeta}>
          {item.postCount} moment{item.postCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SEARCH</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="find real people..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={clear} hitSlop={8}>
            <Text style={styles.clearText}>clear</Text>
          </Pressable>
        )}
      </View>

      {isSearching ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            query.length >= 2 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>no one found</Text>
              </View>
            ) : (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>
                  search by username
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            results.length === 0 ? styles.emptyList : undefined
          }
          keyboardShouldPersistTaps="handled"
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.sm,
  },
  clearText: {
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultInfo: {
    flex: 1,
  },
  resultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultUsername: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  resultMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../theme';

import FeedScreen from '../screens/FeedScreen';
import CaptureScreen from '../screens/CaptureScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TrustScreen from '../screens/TrustScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ─── Stack Navigators ────────────────────────────────────────────────

const FeedStack = createNativeStackNavigator();

function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStack.Screen name="UserProfile" component={UserProfileScreen} />
    </FeedStack.Navigator>
  );
}

const SearchStack = createNativeStackNavigator();

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchHome" component={SearchScreen} />
      <SearchStack.Screen name="UserProfile" component={UserProfileScreen} />
      <SearchStack.Screen name="PostDetail" component={PostDetailScreen} />
    </SearchStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Bookmarks" component={BookmarksScreen} />
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
    </ProfileStack.Navigator>
  );
}

const TrustStack = createNativeStackNavigator();

function TrustStackScreen() {
  return (
    <TrustStack.Navigator screenOptions={{ headerShown: false }}>
      <TrustStack.Screen name="TrustHome" component={TrustScreen} />
    </TrustStack.Navigator>
  );
}

// ─── Tab Navigator ──────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function CaptureTabButton({ focused }: { focused: boolean }) {
  return (
    <View style={styles.captureButton}>
      <View
        style={[
          styles.captureButtonInner,
          focused && styles.captureButtonActive,
        ]}
      >
        <Text style={styles.captureButtonIcon}>+</Text>
      </View>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedStackScreen}
        options={{
          tabBarLabel: 'feed',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'◉'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackScreen}
        options={{
          tabBarLabel: 'search',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'⌕'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <CaptureTabButton focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'alerts',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'●'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'you',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'▪'}
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 84,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  tabIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  tabIconActive: {
    color: colors.text,
  },

  // ─── Capture button (center, prominent) ───────────
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  captureButtonActive: {
    backgroundColor: colors.gray200,
  },
  captureButtonIcon: {
    color: colors.black,
    fontSize: 28,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 30,
  },
});

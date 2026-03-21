import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography, spacing } from '../theme';

import FeedScreen from '../screens/FeedScreen';
import CaptureScreen from '../screens/CaptureScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TrustScreen from '../screens/TrustScreen';

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
        component={FeedScreen}
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
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'you',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'▪'}
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Trust"
        component={TrustScreen}
        options={{
          tabBarLabel: 'trust',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {'✓'}
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

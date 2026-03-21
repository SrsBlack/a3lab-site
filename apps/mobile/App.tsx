import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './src/stores/authStore';
import TabNavigator from './src/navigation/TabNavigator';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import VerifyScreen from './src/screens/auth/VerifyScreen';
import { authAPI } from './src/services/api';
import { colors, typography, spacing } from './src/theme';

type AuthFlow = 'welcome' | 'verify';

const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.white,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  const { isAuthenticated, isLoading, login, setLoading } = useAuthStore();
  const [authFlow, setAuthFlow] = useState<AuthFlow>('welcome');
  const [phone, setPhone] = useState('');

  // Try to restore session on launch
  useEffect(() => {
    const restore = async () => {
      try {
        const token = useAuthStore.getState().token;
        if (token) {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            login(token, res.data.user);
            return;
          }
        }
      } catch {
        // Token expired or invalid
      }
      setLoading(false);
    };
    restore();
  }, [login, setLoading]);

  // Loading splash
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Text style={styles.splashLogo}>PROOF</Text>
        <ActivityIndicator color={colors.textMuted} style={styles.splashLoader} />
      </View>
    );
  }

  // Auth flow
  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        {authFlow === 'welcome' ? (
          <WelcomeScreen
            onPhoneSubmit={(p) => {
              setPhone(p);
              setAuthFlow('verify');
            }}
          />
        ) : (
          <VerifyScreen
            phone={phone}
            onBack={() => setAuthFlow('welcome')}
          />
        )}
      </View>
    );
  }

  // Main app
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <TabNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    color: colors.text,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 8,
  },
  splashLoader: {
    marginTop: spacing.xl,
  },
});

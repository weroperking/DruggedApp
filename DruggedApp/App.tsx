import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  HomeScreen,
  UserInfoScreen,
  ResultsScreen,
  SectionSelectScreen,
  DrugSearchScreen,
  DrugSearchResultsScreen,
  DrugDetailScreen,
  DrugAlternativesScreen,
  MenuScreen,
  DonationScreen,
} from './src/screens';
import { colors } from './src/theme';
import { initDatabase, getDrugCount } from './src/services/drugDatabase';
import { RootStackParamList } from './src/navigation/types';

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const EMPATHY_MESSAGES = [
  "Every small donation helps keep this app free for everyone 💚",
  "Help us maintain this drug database with a small donation 🙏",
  "Your support means we can keep improving this app ❤️",
  "If you find this app useful, consider supporting development 💝",
];

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [drugCount, setDrugCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        const count = await getDrugCount();
        setDrugCount(count);
        console.log('[App] Database initialized, total drugs:', count);
        setDbInitialized(true);
      } catch (error) {
        console.error('[App] Database initialization failed:', error);
        setDbError(String(error));
      }
    };

    initializeApp();
  }, [retryCount]);

  useEffect(() => {
    const setupNotifications = async () => {
      // Skip notifications setup on web
      if (Platform.OS === 'web') {
        console.log('[Notifications] Notifications not supported on web');
        return;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return;
      }

      // Android notification channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('donation-reminders', {
          name: 'Donation reminders',
          description: 'Gentle reminders to support the app',
          importance: Notifications.AndroidImportance.LOW,
          lightColor: colors.primary.green,
        });
      }

      // Check for existing donation reminder
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const hasExistingReminder = scheduledNotifications.some(
        notification => notification.content.data?.tag === 'donation-reminder'
      );

      if (!hasExistingReminder) {
        // Schedule recurring notifications (every 4-6 days, random interval)
        const randomMessage = EMPATHY_MESSAGES[Math.floor(Math.random() * EMPATHY_MESSAGES.length)];
        const intervalDays = Math.floor(Math.random() * 3) + 4; // 4,5,6 days

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Drugged App',
            body: randomMessage,
            data: { screen: 'Donation', tag: 'donation-reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            repeats: true,
            seconds: intervalDays * 24 * 60 * 60,
          },
        });

        console.log(`[Notifications] Scheduled donation reminder every ${intervalDays} days`);
      } else {
        console.log('[Notifications] Donation reminder already scheduled, skipping');
      }
    };

    // Handle notification responses for navigation
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'Donation' && navigationRef.current) {
        navigationRef.current.navigate('Donation');
      }
    };

    // Setup listeners
    let responseSubscription: { remove: () => void } | null = null;
    
    // Only add listener on native platforms
    if (Platform.OS !== 'web') {
      responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    }

    // Check for cold start notification
    const checkColdStartNotification = async () => {
      // Skip on web
      if (Platform.OS === 'web') return;
      
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse && lastResponse.notification.request.content.data?.screen === 'Donation' && navigationRef.current) {
        navigationRef.current.navigate('Donation');
      }
    };

    if (dbInitialized) {
      setupNotifications();
      checkColdStartNotification();
    }

    return () => {
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, [dbInitialized]);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load database</Text>
        <Text style={styles.errorDetail}>{dbError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setDbError(null);
            setRetryCount(c => c + 1);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.green} />
        <Text style={styles.loadingText}>Preparing drug database...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="SectionSelect"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.neutral.offWhite,
          },
          headerTintColor: colors.neutral.black,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.neutral.offWhite,
          },
        }}
      >
        <Stack.Screen
          name="SectionSelect"
          component={SectionSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserInfo"
          component={UserInfoScreen}
          options={{
            title: 'Your Info',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            title: 'Results',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="DrugSearch"
          component={DrugSearchScreen}
          options={{ headerShown: false }}
          initialParams={{ drugCount }}
        />
        <Stack.Screen
          name="DrugSearchResults"
          component={DrugSearchResultsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DrugDetail"
          component={DrugDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DrugAlternatives"
          component={DrugAlternativesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Donation"
          component={DonationScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.offWhite,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent.red,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: colors.neutral.gray,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.primary.green,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});
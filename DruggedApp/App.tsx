import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, G, SvgXml } from 'react-native-svg';
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
import { colors, spacing } from './src/theme';
import { initDatabase, getDrugCount } from './src/services/drugDatabase';
import { RootStackParamList } from './src/navigation/types';

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

const SVG_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640">
    <path fill="#fff" d="M0 0h360v640H0z"/>
    <g class="splash-prescription">
      <rect x="110" y="195" width="140" height="190" rx="14" fill="none" stroke="#22b161" stroke-width="8"/>
      <path d="M136 230c8 0 16 4 16 12s-8 12-16 12h-8v-24Zm-8 24v16m12-16 12 16m-4-12-12 8" fill="none" stroke="#22b161" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path stroke="#22b161" stroke-width="8" stroke-linecap="round" d="M128 298h104m-104 26h78m-78 26h94"/>
    </g>
    <g class="splash-jar">
      <rect x="145" y="190" width="70" height="20" rx="5" fill="#22b161"/>
      <path d="M128 218c0-7 5-7 12-7h80c7 0 12 0 12 7v154c0 14-10 20-24 20h-56c-14 0-24-6-24-20Z" fill="none" stroke="#22b161" stroke-width="8" stroke-linejoin="round"/>
      <rect x="146" y="260" width="68" height="80" rx="6" fill="none" stroke="#22b161" stroke-width="6"/>
      <path stroke="#22b161" stroke-width="6" stroke-linecap="round" d="M160 300h40"/>
    </g>
    <path d="M148 144a13 13 0 0 1 13-13h38a13 13 0 0 1 13 13v98h98a13 13 0 0 1 13 13v38a13 13 0 0 1-13 13h-98v98a13 13 0 0 1-13 13h-38a13 13 0 0 1-13-13v-98H50a13 13 0 0 1-13-13v-38a13 13 0 0 1 13-13h98Z" fill="#22b161" class="splash-logo"/>
  </svg>
`;

function AnimatedSplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const animationDuration = 4500;

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, animationDuration);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const id = 'splash-animation-keyframes';
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes prescriptionSequence{0%,40%,to{transform:scale(0);opacity:0}32%,8%{transform:scale(.9);opacity:1}16%{transform:scale(.9) rotate(-3deg)}24%{transform:scale(.9) rotate(0deg)}}
        @keyframes jarSequence{0%,40%,80%,to{transform:scale(0);opacity:0}48%,72%{transform:scale(.9);opacity:1}56%{transform:scale(.9) rotate(-3deg)}64%{transform:scale(.9) rotate(0deg)}}
        @keyframes logoEntrance{0%,80%{transform:scale(0);opacity:0}90%{transform:scale(1.05);opacity:1}to{transform:scale(1);opacity:1}}
        .splash-prescription { animation: prescriptionSequence 4.5s ease-in-out infinite; transform-origin: 180px 290px; }
        .splash-jar { animation: jarSequence 4.5s ease-in-out infinite; transform-origin: 180px 290px; }
        .splash-logo { animation: logoEntrance 4.5s cubic-bezier(.175,.885,.32,1.275) forwards infinite; transform-origin: 180px 290px; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const prescriptionScale = useRef(new Animated.Value(0)).current;
  const prescriptionOpacity = useRef(new Animated.Value(0)).current;
  const jarScale = useRef(new Animated.Value(0)).current;
  const jarOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const prescriptionAnimatedStyle = {
    opacity: prescriptionOpacity,
    transform: [{ scale: prescriptionScale }],
  };

  const jarAnimatedStyle = {
    opacity: jarOpacity,
    transform: [{ scale: jarScale }],
  };

  const logoAnimatedStyle = {
    opacity: logoOpacity,
    transform: [{ scale: logoScale }],
  };

  useEffect(() => {
    const prescriptionAnim = Animated.sequence([
      Animated.parallel([
        Animated.timing(prescriptionScale, { toValue: 0.9, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(prescriptionOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(prescriptionScale, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(prescriptionScale, { toValue: 0.9, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(prescriptionScale, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(prescriptionOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]);

    const jarAnim = Animated.sequence([
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(jarScale, { toValue: 0.9, duration: 1200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(jarOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(jarScale, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(jarScale, { toValue: 0.9, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(jarScale, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(jarOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]);

    const logoAnim = Animated.sequence([
      Animated.delay(3600),
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.timing(logoScale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]);

    prescriptionAnim.start();
    jarAnim.start();
    logoAnim.start();

    return () => {
      prescriptionAnim.stop();
      jarAnim.stop();
      logoAnim.stop();
    };
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.splashFullScreen, { backgroundColor: colors.neutral.offWhite }]}>
        <View style={StyleSheet.absoluteFill}>
          <SvgXml xml={SVG_HTML} width="100%" height="100%" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.splashFullScreen}>
      <View style={styles.splashBackground}>
        <Svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet">
          <Path fill="#fff" d="M0 0h360v640H0z" />
        </Svg>
      </View>
      <View style={styles.splashCenter}>
        <Animated.View style={[styles.splashLayer, prescriptionAnimatedStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet">
            <Rect x="110" y="195" width="140" height="190" rx="14" fill="none" stroke="#22b161" strokeWidth="8" />
            <Path d="M136 230c8 0 16 4 16 12s-8 12-16 12h-8v-24Zm-8 24v16m12-16 12 16m-4-12-12 8" fill="none" stroke="#22b161" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <Path stroke="#22b161" strokeWidth="8" strokeLinecap="round" d="M128 298h104m-104 26h78m-78 26h94" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.splashLayer, jarAnimatedStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet">
            <Rect x="145" y="190" width="70" height="20" rx="5" fill="#22b161" />
            <Path d="M128 218c0-7 5-7 12-7h80c7 0 12 0 12 7v154c0 14-10 20-24 20h-56c-14 0-24-6-24-20Z" fill="none" stroke="#22b161" strokeWidth="8" strokeLinejoin="round" />
            <Rect x="146" y="260" width="68" height="80" rx="6" fill="none" stroke="#22b161" strokeWidth="6" />
            <Path stroke="#22b161" strokeWidth="6" strokeLinecap="round" d="M160 300h40" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.splashLayer, logoAnimatedStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet">
            <Path d="M148 144a13 13 0 0 1 13-13h38a13 13 0 0 1 13 13v98h98a13 13 0 0 1 13 13v38a13 13 0 0 1-13 13h-98v98a13 13 0 0 1-13 13h-38a13 13 0 0 1-13-13v-98H50a13 13 0 0 1-13-13v-38a13 13 0 0 1 13-13h98Z" fill="#22b161" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [drugCount, setDrugCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
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
      if (Platform.OS === 'web') {
        console.log('[Notifications] Notifications not supported on web');
        return;
      }

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

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('donation-reminders', {
          name: 'Donation reminders',
          description: 'Gentle reminders to support the app',
          importance: Notifications.AndroidImportance.LOW,
          lightColor: colors.primary.green,
        });
      }

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const hasExistingReminder = scheduledNotifications.some(
        notification => notification.content.data?.tag === 'donation-reminder'
      );

      if (!hasExistingReminder) {
        const randomMessage = EMPATHY_MESSAGES[Math.floor(Math.random() * EMPATHY_MESSAGES.length)];
        const intervalDays = Math.floor(Math.random() * 3) + 4;

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

    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'Donation' && navigationRef.current) {
        navigationRef.current.navigate('Donation');
      }
    };

    let responseSubscription: { remove: () => void } | null = null;
    
    if (Platform.OS !== 'web') {
      responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    }

    const checkColdStartNotification = async () => {
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

  if (!splashAnimationComplete || !dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <AnimatedSplashScreen onAnimationComplete={() => setSplashAnimationComplete(true)} />
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
    padding: spacing.lg,
  },
  splashFullScreen: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  splashBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  splashCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  splashEmoji: {
    fontSize: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.neutral.black,
    marginBottom: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral.black,
    marginBottom: spacing.xs,
  },
  loadingSubtext: {
    fontSize: 14,
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
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
} from './src/screens';
import { colors } from './src/theme';
import { Drug, initDatabase, getDrugCount } from './src/services/drugDatabase';
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [drugCount, setDrugCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

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
    <NavigationContainer>
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
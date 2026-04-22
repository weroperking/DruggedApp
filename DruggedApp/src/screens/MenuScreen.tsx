import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type MenuScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Menu'>;
};

type BugType = 'drug' | 'logic' | 'consult' | 'donate' | null;

export const MenuScreen: React.FC<MenuScreenProps> = ({ navigation }) => {
  const [selectedBug, setSelectedBug] = useState<BugType>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleBugSelect = (bugType: BugType) => {
    setSelectedBug(bugType);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirm = () => {
    if (selectedBug === 'drug') {
      Linking.openURL('mailto:weroperking@gmail.com?subject=Drug%20Data%20Bug%20Report');
    } else if (selectedBug === 'logic') {
      Linking.openURL('mailto:weroperking@gmail.com?subject=App%20Logic%20Bug%20Report');
    } else if (selectedBug === 'consult') {
      Linking.openURL('mailto:weroperking@gmail.com?subject=Consultation%20Request');
    } else if (selectedBug === 'donate') {
      navigation.navigate('Donation');
    }
  };

  const handleBack = () => {
    if (selectedBug) {
      setSelectedBug(null);
      fadeAnim.setValue(0);
    } else {
      navigation.goBack();
    }
  };

  const bugOptions = [
    {
      type: 'drug' as BugType,
      title: 'Drug Data Issue',
      description: 'Report incorrect drug information or data that needs updating',
      icon: '💊',
    },
    {
      type: 'logic' as BugType,
      title: 'App Logic Bug',
      description: 'Report an application error, crash, or functionality problem',
      icon: '🐛',
    },
    {
      type: 'consult' as BugType,
      title: 'Contact Creator',
      description: 'General inquiries, feedback, or consultation requests',
      icon: '✉️',
    },
    {
      type: 'donate' as BugType,
      title: 'Support Development',
      description: 'Make a donation to help keep this app free and maintained',
      icon: '💝',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backText}>‹ {selectedBug ? 'Back' : 'Close'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>
          {selectedBug ? 'Confirm your selection' : 'Report an issue, contact us, or support development'}
        </Text>
      </View>

      <View style={styles.content}>
        {!selectedBug ? (
          <View style={styles.optionsContainer}>
            {bugOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.optionCard}
                onPress={() => handleBugSelect(option.type)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Animated.View style={[styles.confirmContainer, { opacity: fadeAnim }]}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmIcon}>
                {bugOptions.find(o => o.type === selectedBug)?.icon}
              </Text>
              <Text style={styles.confirmTitle}>
                {bugOptions.find(o => o.type === selectedBug)?.title}
              </Text>
              <Text style={styles.confirmDescription}>
                {bugOptions.find(o => o.type === selectedBug)?.description}
              </Text>
              {selectedBug !== 'donate' && (
                <>
                  <Text style={styles.emailText}>
                    This will open your email app to send a report to:
                  </Text>
                  <Text style={styles.emailAddress}>weroperking@gmail.com</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {selectedBug === 'donate' ? 'Go to Donations' : 'Send Report'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.primary.green,
    fontWeight: '600',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    ...typography.small,
    color: colors.neutral.gray,
  },
  arrow: {
    fontSize: 24,
    color: colors.neutral.gray,
    fontWeight: '600',
  },
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  confirmCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.border.light,
    ...shadows.medium,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  confirmDescription: {
    ...typography.body,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emailText: {
    ...typography.small,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emailAddress: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary.green,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.medium,
  },
  confirmButtonText: {
    ...typography.button,
  },
});

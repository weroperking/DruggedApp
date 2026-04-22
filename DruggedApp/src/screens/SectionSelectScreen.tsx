import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type SectionSelectScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SectionSelect'>;
};

export const SectionSelectScreen: React.FC<SectionSelectScreenProps> = ({
  navigation,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Welcome to Drugged</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate('Menu')}
              activeOpacity={0.8}
            >
              <Text style={styles.menuButtonText}>☰</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Choose how you need help
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionIcon}>
            <Text style={styles.iconText}>💊</Text>
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>OTC Recommendation</Text>
            <Text style={styles.sectionDescription}>
              Find safe over-the-counter medications based on your symptoms and health profile
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => navigation.navigate('DrugSearch', {})}
          activeOpacity={0.8}
        >
          <View style={styles.sectionIcon}>
            <Text style={styles.iconText}>🔍</Text>
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>Drug Search</Text>
            <Text style={styles.sectionDescription}>
              Search our database of {23596}+ drugs and find alternatives
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Educational use only. Consult a pharmacist before taking any medication.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Donation')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Donate"
        accessibilityHint="Open donation screen"
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
      >
        <Text style={styles.fabIcon}>❤️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  menuButtonText: {
    fontSize: 24,
    color: colors.neutral.charcoal,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.small,
    color: colors.neutral.gray,
  },
  arrow: {
    fontSize: 28,
    color: colors.neutral.gray,
    fontWeight: '300',
  },
  disclaimer: {
    marginTop: 'auto',
    padding: spacing.md,
  },
  disclaimerText: {
    ...typography.small,
    color: colors.neutral.gray,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.green,
    borderWidth: 3,
    borderColor: colors.primary.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  fabIcon: {
    fontSize: 24,
    color: colors.neutral.white,
  },
});
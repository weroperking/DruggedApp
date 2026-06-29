import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { getDisclaimer } from '../services/constraintEngine';

type DisclaimerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Disclaimer'>;
};

export const DisclaimerScreen: React.FC<DisclaimerScreenProps> = ({ navigation }) => {
  const disclaimer = getDisclaimer();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Disclaimer</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.disclaimerText}>{disclaimer}</Text>
        </View>
      </ScrollView>
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
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  disclaimerText: {
    ...typography.body,
    color: colors.neutral.charcoal,
    lineHeight: 22,
  },
});

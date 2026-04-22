import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type DonationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Donation'>;
};

const DONATION_PHONE = process.env.EXPO_PUBLIC_DONATION_PHONE || '+201277707096';

if (__DEV__ && !process.env.EXPO_PUBLIC_DONATION_PHONE) {
  console.warn('EXPO_PUBLIC_DONATION_PHONE environment variable is missing, using placeholder');
}

export const DonationScreen: React.FC<DonationScreenProps> = ({ navigation }) => {
  const [qrImageError, setQrImageError] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Support Drugged App 💚</Text>
        <Text style={styles.subtitle}>
          Your donations help keep this app free, updated and maintained for everyone
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introIcon}>🙏</Text>
          <Text style={styles.introText}>
            This app is completely free and ad-free. Every contribution helps cover server costs, database updates and ongoing development.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose a donation method:</Text>

        <View style={styles.optionsContainer}>
          <View style={styles.optionCard}>
            <Text style={styles.optionIcon}>📱</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Instapay</Text>
              <Text style={styles.optionDescription}>
                Scan QR code or send directly to:
              </Text>
              <Text style={styles.phoneNumber}>{DONATION_PHONE}</Text>
            </View>
          </View>

          <View style={styles.qrCard}>
            {qrImageError ? (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            ) : (
              <Image
                source={require('../assets/qr.png')}
                style={styles.qrImage}
                resizeMode="contain"
                onError={() => setQrImageError(true)}
              />
            )}
            <Text style={styles.qrHint}>Scan this QR code with Instapay</Text>
          </View>

          <View style={styles.optionCard}>
            <Text style={styles.optionIcon}>💳</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>eWallet</Text>
              <Text style={styles.optionDescription}>
                Send donation to:
              </Text>
              <Text style={styles.phoneNumber}>{DONATION_PHONE}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.thankYouCard}>
        <Text style={styles.thankYouText}>
          Thank you for your support! Every donation makes a difference 💚
        </Text>
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
  },
  scrollContentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  introCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary.green,
    ...shadows.medium,
    alignItems: 'center',
    gap: spacing.sm,
  },
  introIcon: {
    fontSize: 48,
  },
  introText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.neutral.charcoal,
  },
  sectionTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
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
    fontSize: 36,
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    ...typography.h3,
  },
  optionDescription: {
    ...typography.small,
    color: colors.neutral.gray,
  },
  phoneNumber: {
    ...typography.h3,
    color: colors.primary.green,
    fontWeight: '700',
  },
  qrCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.border.light,
    ...shadows.medium,
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.md,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.offWhite,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    ...typography.h3,
    color: colors.neutral.gray,
  },
  qrHint: {
    ...typography.small,
    color: colors.neutral.gray,
    textAlign: 'center',
  },
  thankYouCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.primary.green,
    alignItems: 'center',
    margin: spacing.lg,
    marginTop: 0,
  },
  thankYouText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary.darkGreen,
    textAlign: 'center',
  },
});

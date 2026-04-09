import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button, Card, PillBadge, StatusBadge } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';
import {
  getSafeOTCOptions,
  UserConstraints,
  OTCOption,
} from '../services/constraintEngine';

type RootStackParamList = {
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  Disclaimer: undefined;
};

type ResultsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const { symptom, age, sex, pregnancy } = route.params;

  const constraints: UserConstraints = {
    age,
    sex: sex as 'male' | 'female',
    pregnancy,
    symptom,
  };

  const options = getSafeOTCOptions(constraints);

  const getRiskBadgeVariant = (risk: OTCOption['riskLevel']) => {
    switch (risk) {
      case 'safe':
        return 'green';
      case 'caution':
        return 'yellow';
      case 'avoid':
        return 'red';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Safe Options for {symptom}</Text>
          <Text style={styles.subtitle}>
            Based on your profile: {age} years, {sex}
            {pregnancy ? ', pregnant' : ''}
          </Text>
        </View>

        {options.length === 0 ? (
          <View style={styles.noOptions}>
            <Text style={styles.noOptionsText}>
              No OTC options found. Please consult a pharmacist or doctor.
            </Text>
          </View>
        ) : (
          options.map((option, index) => (
            <Card
              key={index}
              variant={option.firstLine ? 'highlighted' : 'default'}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.ingredientName}>
                  {option.ingredient.name}
                </Text>
                <PillBadge
                  text={option.riskLevel.toUpperCase()}
                  variant={getRiskBadgeVariant(option.riskLevel)}
                />
              </View>

              <Text style={styles.notes}>{option.ingredient.notes}</Text>

              <View style={styles.brandsSection}>
                <Text style={styles.brandsTitle}>Available Brands:</Text>
                <Text style={styles.brandsList}>
                  {option.ingredient.egyptian_brand_names.join(', ')}
                </Text>
              </View>

              {option.ingredient.warnings.length > 0 && (
                <View style={styles.warningsSection}>
                  {option.ingredient.warnings.map((warning, wIndex) => (
                    <Text key={wIndex} style={styles.warning}>
                      ⚠️ {warning}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.duration}>
                <Text style={styles.durationText}>
                  Max use: {option.ingredient.max_duration_days} days
                </Text>
              </View>
            </Card>
          ))
        )}

        <View style={styles.whenToSee}>
          <Text style={styles.whenToSeeTitle}>When to see a doctor:</Text>
          <Text style={styles.whenToSeeList}>
            - Symptoms persist beyond recommended duration
          </Text>
          <Text style={styles.whenToSeeList}>
            - Symptoms worsen or new symptoms appear
          </Text>
          <Text style={styles.whenToSeeList}>
            - You have underlying health conditions
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Educational use only. Always consult a licensed pharmacist or doctor
            before taking any medication.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Start Over" onPress={() => navigation.navigate('Home')} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ingredientName: {
    ...typography.h2,
    flex: 1,
  },
  notes: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  brandsSection: {
    backgroundColor: colors.neutral.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  brandsTitle: {
    ...typography.small,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  brandsList: {
    ...typography.body,
  },
  warningsSection: {
    backgroundColor: '#FFE6E6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent.red,
  },
  warning: {
    ...typography.small,
    color: colors.accent.red,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  duration: {
    marginTop: spacing.sm,
  },
  durationText: {
    ...typography.small,
    fontWeight: '600',
  },
  whenToSee: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: colors.accent.blue,
    marginTop: spacing.md,
  },
  whenToSeeTitle: {
    ...typography.h3,
    color: colors.accent.blue,
    marginBottom: spacing.sm,
  },
  whenToSeeList: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  disclaimer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.accent.yellow,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    ...typography.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  noOptions: {
    backgroundColor: '#FFE6E6',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 4,
    borderColor: colors.accent.red,
  },
  noOptionsText: {
    ...typography.body,
    color: colors.accent.red,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.neutral.offWhite,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
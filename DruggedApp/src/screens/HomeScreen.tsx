import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PillBadge, SymptomCard } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';
import { getSymptomsList } from '../services/constraintEngine';

type RootStackParamList = {
  SectionSelect: undefined;
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  Disclaimer: undefined;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const symptoms = getSymptomsList();

  const handleContinue = () => {
    if (selectedSymptom) {
      navigation.navigate('UserInfo', { symptom: selectedSymptom });
    }
  };

  const renderSymptomCard = (symptom: string, index: number) => (
    <View key={symptom} style={index % 2 === 0 ? styles.cardWrapperLeft : styles.cardWrapperRight}>
      <SymptomCard
        name={symptom}
        selected={selectedSymptom === symptom}
        onPress={() => setSelectedSymptom(symptom)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('SectionSelect')}
          >
            <Text style={styles.backText}>‹ Select Section</Text>
          </TouchableOpacity>
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Select your main symptom
          </Text>
        </View>

        <View style={styles.symptomsGrid}>
          {symptoms.map((symptom, index) => renderSymptomCard(symptom, index))}
        </View>

        <View style={styles.disclaimer}>
          <PillBadge text="DISCLAIMER" variant="yellow" />
          <Text style={styles.disclaimerText}>
            Educational use only. Consult a pharmacist before taking any medication.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            !selectedSymptom && styles.buttonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedSymptom}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          accessibilityState={{ disabled: !selectedSymptom }}
        >
          <Text style={[
            styles.buttonText,
            !selectedSymptom && styles.buttonTextDisabled
          ]}>
            Continue
          </Text>
        </TouchableOpacity>
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
  subtitle: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  cardWrapperLeft: {
    width: '48%',
    marginRight: '2%',
    marginBottom: spacing.md,
  },
  cardWrapperRight: {
    width: '48%',
    marginLeft: '2%',
    marginBottom: spacing.md,
  },
  disclaimer: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent.yellow,
  },
  disclaimerText: {
    ...typography.small,
    marginTop: spacing.sm,
    color: colors.neutral.charcoal,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.neutral.offWhite,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  button: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral.gray,
    borderColor: colors.neutral.gray,
  },
  buttonTextDisabled: {
    color: colors.neutral.charcoal,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';

type RootStackParamList = {
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  Disclaimer: undefined;
};

type UserInfoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserInfo'>;
  route: RouteProp<RootStackParamList, 'UserInfo'>;
};

export const UserInfoScreen: React.FC<UserInfoScreenProps> = ({
  navigation,
  route,
}) => {
  const { symptom } = route.params;
  const [age, setAge] = useState('');
  const [customAge, setCustomAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [pregnancy, setPregnancy] = useState<boolean | null>(null);

  const finalAge = customAge || age;

  const isValid = finalAge !== '' && sex !== null && (sex === 'male' || pregnancy !== null);

  const handleContinue = () => {
    if (isValid) {
      navigation.navigate('Results', {
        symptom,
        age: parseInt(finalAge, 10),
        sex: sex as string,
        pregnancy: sex === 'female' ? pregnancy === true : false,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us find safe options for you
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Your age</Text>
          <View style={styles.ageInputContainer}>
            {[25, 35, 45, 55, 65].map((ageOption) => (
              <TouchableOpacity
                key={ageOption}
                style={[
                  styles.ageOption,
                  age === ageOption.toString() && styles.ageOptionSelected,
                ]}
                onPress={() => setAge(ageOption.toString())}
              >
                <Text
                  style={[
                    styles.ageOptionText,
                    age === ageOption.toString() && styles.ageOptionTextSelected,
                  ]}
                >
                  {ageOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.orText}>or enter your exact age</Text>
          <View style={styles.customAgeContainer}>
            <TouchableOpacity
              style={[
                styles.ageOption,
                age === '18' && styles.ageOptionSelected,
              ]}
              onPress={() => {
                setAge('18');
                setCustomAge('');
              }}
            >
              <Text
                style={[
                  styles.ageOptionText,
                  age === '18' && styles.ageOptionTextSelected,
                ]}
              >
                18
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ageOption,
                age === '30' && styles.ageOptionSelected,
              ]}
              onPress={() => {
                setAge('30');
                setCustomAge('');
              }}
            >
              <Text
                style={[
                  styles.ageOptionText,
                  age === '30' && styles.ageOptionTextSelected,
                ]}
              >
                30
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.ageOption,
                age === '50' && styles.ageOptionSelected,
              ]}
              onPress={() => {
                setAge('50');
                setCustomAge('');
              }}
            >
              <Text
                style={[
                  styles.ageOptionText,
                  age === '50' && styles.ageOptionTextSelected,
                ]}
              >
                50
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.customAgeInput,
                customAge !== '' && styles.customAgeInputSelected,
              ]}
              placeholder="Type your age..."
              placeholderTextColor={colors.neutral.gray}
              keyboardType="number-pad"
              maxLength={3}
              value={customAge}
              onChangeText={(text) => {
                setCustomAge(text.replace(/[^0-9]/g, ''));
                if (text) setAge('');
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Your sex</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.option,
                sex === 'male' && styles.optionSelected,
              ]}
              onPress={() => setSex('male')}
            >
              <Text
                style={[
                  styles.optionText,
                  sex === 'male' && styles.optionTextSelected,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                sex === 'female' && styles.optionSelected,
              ]}
              onPress={() => setSex('female')}
            >
              <Text
                style={[
                  styles.optionText,
                  sex === 'female' && styles.optionTextSelected,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {sex === 'female' && (
          <View style={styles.section}>
            <Text style={styles.label}>Are you pregnant?</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.option,
                  pregnancy === true && styles.optionSelected,
                ]}
                onPress={() => setPregnancy(true)}
              >
                <Text
                  style={[
                    styles.optionText,
                    pregnancy === true && styles.optionTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  pregnancy === false && styles.optionSelected,
                ]}
                onPress={() => setPregnancy(false)}
              >
                <Text
                  style={[
                    styles.optionText,
                    pregnancy === false && styles.optionTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Find Safe Options"
          onPress={handleContinue}
          variant={isValid ? 'primary' : 'disabled'}
        />
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
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  ageInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  customAgeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inputWrapper: {
    marginTop: spacing.md,
  },
  customAgeInput: {
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.button,
    color: colors.neutral.charcoal,
  },
  customAgeInputSelected: {
    borderColor: colors.primary.green,
    borderWidth: 4,
  },
  orText: {
    ...typography.small,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  ageOption: {
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  ageOptionSelected: {
    borderColor: colors.primary.green,
    borderWidth: 4,
  },
  ageOptionText: {
    ...typography.button,
    color: colors.neutral.charcoal,
  },
  ageOptionTextSelected: {
    color: colors.primary.green,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary.green,
    borderWidth: 4,
  },
  optionText: {
    ...typography.button,
    color: colors.neutral.charcoal,
  },
  optionTextSelected: {
    color: colors.primary.green,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.neutral.offWhite,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
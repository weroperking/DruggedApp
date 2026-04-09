import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'disabled';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
}) => {
  const isDisabled = variant === 'disabled';
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      <View style={isPrimary && styles.buttonInner}>
        <Text style={[styles.buttonText, isDisabled && styles.disabledText]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonInner: {
    borderBottomWidth: 4,
    borderBottomColor: colors.primary.darkGreen,
    paddingVertical: spacing.md - 4,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.xl,
    marginBottom: -4,
  },
  primaryButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    ...shadows.medium,
  },
  secondaryButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 4,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  disabledButton: {
    backgroundColor: colors.neutral.gray,
    borderWidth: 4,
    borderColor: colors.border.dark,
  },
  buttonText: {
    ...typography.button,
    textAlign: 'center',
  },
  disabledText: {
    color: colors.neutral.white,
  },
});
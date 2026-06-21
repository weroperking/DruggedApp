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
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonInner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: -spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 2,
    borderColor: colors.primary.darkGreen,
    ...shadows.small,
  },
  secondaryButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.small,
  },
  disabledButton: {
    backgroundColor: colors.neutral.gray,
    borderWidth: 2,
    borderColor: colors.border.dark,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
    textAlign: 'center',
  },
  disabledText: {
    color: colors.neutral.white,
  },
});
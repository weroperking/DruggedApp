import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

interface SymptomCardProps {
  name: string;
  onPress: () => void;
  selected?: boolean;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({
  name,
  onPress,
  selected = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        selected && styles.selectedCard,
      ]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
  },
  selectedCard: {
    backgroundColor: colors.neutral.white,
    borderWidth: 4,
    borderColor: colors.primary.green,
    ...shadows.medium,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  selectedText: {
    color: colors.primary.green,
    fontWeight: '700',
  },
});
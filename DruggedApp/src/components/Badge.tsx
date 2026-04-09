import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface PillBadgeProps {
  text: string;
  variant?: 'purple' | 'green' | 'blue' | 'red' | 'yellow';
  style?: ViewStyle;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  text,
  variant = 'purple',
  style,
}) => {
  const variantColors = {
    purple: { bg: colors.accent.purple, border: '#B56DE6' },
    green: { bg: colors.primary.green, border: colors.primary.darkGreen },
    blue: { bg: colors.accent.blue, border: '#0F9BE6' },
    red: { bg: colors.accent.red, border: '#E63C3C' },
    yellow: { bg: colors.accent.yellow, border: '#E6B400' },
  };

  return (
    <View
      style={[
        styles.pillBadge,
        { backgroundColor: variantColors[variant].bg },
        style,
      ]}
    >
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning';
  text: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const statusColors = {
    active: colors.primary.green,
    inactive: colors.neutral.gray,
    warning: colors.accent.red,
  };

  return (
    <View style={styles.statusBadge}>
      <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
      <Text style={styles.statusText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pillBadge: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md - 2,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral.charcoal,
  },
});
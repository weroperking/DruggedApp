import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Drug } from '../services/drugDatabase';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

export interface DrugActionMenuProps {
  drug: Drug | null;
  visible: boolean;
  onClose: () => void;
  onSimilar?: (drug: Drug) => void;
  onAlternatives?: (drug: Drug) => void;
  onDetails?: (drug: Drug) => void;
  blurAnim?: Animated.Value;
  menuAnim?: Animated.Value;
  position?: 'center' | 'bottom';
}

export const DrugActionMenu: React.FC<DrugActionMenuProps> = ({
  drug,
  visible,
  onClose,
  onSimilar,
  onAlternatives,
  onDetails,
  blurAnim,
  menuAnim,
  position = 'center',
}) => {
  if (!drug || !visible) return null;

  const overlayStyle = [
    styles.overlay,
    position === 'bottom' ? styles.overlayBottom : styles.overlayCenter,
  ];

  const menuContainerStyle = [
    styles.menuContainer,
    position === 'bottom' && styles.menuContainerBottom,
    menuAnim ? {
      transform: [{
        translateY: menuAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      }],
    } : undefined,
  ];

  const previewStyle = [
    styles.selectedCardPreview,
    position === 'bottom' && styles.selectedCardPreviewBottom,
  ];

  const lastItemStyle = [
    styles.menuItem,
    styles.menuItemLast,
    position === 'bottom' && styles.menuItemCancel,
  ];

  return (
    <Animated.View style={[overlayStyle, blurAnim && { opacity: blurAnim }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      
      <Animated.View style={menuContainerStyle}>
        <View style={previewStyle}>
          <Text style={styles.previewName}>{drug.trade_name}</Text>
          <Text style={styles.previewIngredient}>{drug.active_ingredient}</Text>
        </View>

        {onSimilar && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onSimilar(drug)}
          >
            <Text style={styles.menuItemText}>Similar</Text>
            <Text style={styles.menuItemSubtext}>Same active ingredient</Text>
          </TouchableOpacity>
        )}

        {onAlternatives && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onAlternatives(drug)}
          >
            <Text style={styles.menuItemText}>Alternatives</Text>
            <Text style={styles.menuItemSubtext}>Same function, different ingredient</Text>
          </TouchableOpacity>
        )}

        {position === 'bottom' ? (
          <TouchableOpacity
            style={lastItemStyle}
            onPress={onClose}
          >
            <Text style={styles.menuItemLastText}>Cancel</Text>
            <Text style={styles.menuItemLastSubtext}>Close menu</Text>
          </TouchableOpacity>
        ) : (
          onDetails && (
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => onDetails(drug)}
            >
              <Text style={styles.menuItemText}>Details</Text>
              <Text style={styles.menuItemSubtext}>View full information</Text>
            </TouchableOpacity>
          )
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 1000,
  },
  overlayCenter: {
    justifyContent: 'center',
  },
  overlayBottom: {
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  menuContainer: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuContainerBottom: {
    borderWidth: 4,
    borderColor: colors.border.light,
    ...shadows.large,
  },
  selectedCardPreview: {
    padding: spacing.lg,
    backgroundColor: colors.primary.green,
  },
  selectedCardPreviewBottom: {
    borderBottomWidth: 4,
    borderBottomColor: colors.primary.darkGreen,
  },
  previewName: {
    ...typography.h2,
    color: colors.neutral.white,
    marginBottom: spacing.xs,
  },
  previewIngredient: {
    ...typography.body,
    color: colors.neutral.white,
    opacity: 0.9,
  },
  menuItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemCancel: {
    backgroundColor: colors.accent.red,
    borderBottomLeftRadius: borderRadius.xl - 4,
    borderBottomRightRadius: borderRadius.xl - 4,
  },
  menuItemText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  menuItemSubtext: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  menuItemLastText: {
    ...typography.h2,
    marginBottom: spacing.xs,
    color: colors.neutral.white,
  },
  menuItemLastSubtext: {
    ...typography.body,
    color: colors.neutral.white,
    opacity: 0.9,
  },
});
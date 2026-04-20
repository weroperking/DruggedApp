import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Drug } from '../services/drugDatabase';
import { RootStackParamList } from '../navigation/types';

type DrugDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugDetail'>;
  route: RouteProp<RootStackParamList, 'DrugDetail'>;
};

export const DrugDetailScreen: React.FC<DrugDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { drug } = route.params;
  const [showMenu, setShowMenu] = useState(false);
  const [blurAnim] = useState(new Animated.Value(0));
  const [menuAnim] = useState(new Animated.Value(0));

  const handleLongPress = () => {
    setShowMenu(true);
    Animated.parallel([
      Animated.timing(blurAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(blurAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setShowMenu(false));
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null }) =>
    value ? (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    ) : null;

  const hasInfo = drug.manufacturer || drug.distributor || drug.category || drug.subcategory || drug.subcategory2 || drug.route;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <TouchableOpacity
          style={styles.titleSection}
          onLongPress={handleLongPress}
          delayLongPress={300}
          activeOpacity={1}
        >
          <Text style={styles.drugName}>{drug.trade_name}</Text>
          <Text style={styles.ingredient}>{drug.active_ingredient}</Text>
        </TouchableOpacity>

        {/* Details Card */}
        {hasInfo && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Drug Information</Text>
            <InfoRow label="Manufacturer" value={drug.manufacturer} />
            <InfoRow label="Distributor" value={drug.distributor} />
            <InfoRow label="Category" value={drug.category} />
            <InfoRow label="Subcategory" value={drug.subcategory} />
            <InfoRow label="Class" value={drug.subcategory2} />
            <InfoRow label="Administration Route" value={drug.route} />
          </View>
        )}

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <Text style={styles.disclaimerText}>
            This information is for reference only. Always consult a qualified healthcare provider before starting any medication.
            Do not self-diagnose or self-medicate based on this data.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={() => navigation.navigate('DrugAlternatives', { drug, mode: 'similar' })}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.actionButtonPrimaryText}>Similar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => navigation.navigate('DrugAlternatives', { drug, mode: 'alternatives' })}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInnerSecondary}>
              <Text style={styles.actionButtonSecondaryText}>Alternatives</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Blur Overlay and Action Menu */}
      {showMenu && (
        <Animated.View style={[
          styles.overlay,
          { opacity: blurAnim }
        ]}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
           <Animated.View style={[
             styles.menuContainer,
             {
               transform: [{
                 translateY: menuAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [300, 0],
                 }),
               }],
             }
           ]}>
            <View style={styles.selectedCardPreview}>
              <Text style={styles.previewName}>{drug.trade_name}</Text>
              <Text style={styles.previewIngredient}>{drug.active_ingredient}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                navigation.navigate('DrugAlternatives', { drug, mode: 'similar' });
              }}
            >
              <Text style={styles.menuItemText}>Similar</Text>
              <Text style={styles.menuItemSubtext}>Same active ingredient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                navigation.navigate('DrugAlternatives', { drug, mode: 'alternatives' });
              }}
            >
              <Text style={styles.menuItemText}>Alternatives</Text>
              <Text style={styles.menuItemSubtext}>Same function, different ingredient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={closeMenu}
            >
              <Text style={styles.menuItemLastText}>Cancel</Text>
              <Text style={styles.menuItemLastSubtext}>Close menu</Text>
            </TouchableOpacity>
           </Animated.View>
         </Animated.View>
      )}
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
    paddingBottom: spacing.sm,
  },
  backButton: {},
  backText: {
    ...typography.body,
    color: colors.primary.green,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  drugName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  ingredient: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    ...typography.body,
    color: colors.neutral.gray,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  disclaimerText: {
    ...typography.small,
    color: colors.neutral.gray,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButtonPrimary: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    ...shadows.medium,
  },
  buttonInner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.xl,
  },
  actionButtonPrimaryText: {
    ...typography.button,
    textAlign: 'center',
    color: colors.neutral.white,
  },
  actionButtonSecondary: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.white,
    borderWidth: 4,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  buttonInnerSecondary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.xl,
  },
  actionButtonSecondaryText: {
    ...typography.button,
    textAlign: 'center',
    color: colors.neutral.black,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    zIndex: 1000,
  },
  menuContainer: {
    width: '100%',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.border.light,
    ...shadows.large,
  },
  selectedCardPreview: {
    padding: spacing.lg,
    backgroundColor: colors.primary.green,
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
    borderBottomWidth: 2,
    borderBottomColor: colors.border.light,
  },
  menuItemLast: {
    borderBottomWidth: 0,
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

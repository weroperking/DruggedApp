import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { DrugActionMenu } from '../components/DrugActionMenu';
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

  const handleMenuNavigate = (screen: string, drug: Drug, mode?: 'similar' | 'alternatives') => {
    closeMenu();
    if (screen === 'DrugAlternatives' && mode) {
      navigation.navigate('DrugAlternatives', { drug, mode });
    } else {
      navigation.navigate(screen as any, { drug });
    }
  };

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

      <DrugActionMenu
        drug={showMenu ? drug : null}
        visible={showMenu}
        onClose={closeMenu}
        blurAnim={blurAnim}
        menuAnim={menuAnim}
        position="bottom"
        onNavigate={handleMenuNavigate}
      />
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
  actionButtonsContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButtonPrimary: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    overflow: 'hidden',
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
    overflow: 'hidden',
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
});

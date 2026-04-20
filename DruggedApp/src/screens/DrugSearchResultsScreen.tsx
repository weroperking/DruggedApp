import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Drug } from '../services/drugDatabase';
import { RootStackParamList } from '../navigation/types';

type DrugSearchResultsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugSearchResults'>;
  route: RouteProp<RootStackParamList, 'DrugSearchResults'>;
};

export const DrugSearchResultsScreen: React.FC<DrugSearchResultsScreenProps> = ({
  navigation,
  route,
}) => {
  const { drugs, query } = route.params;
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [blurAnim] = useState(new Animated.Value(0));

  const handleLongPress = useCallback((drug: Drug) => {
    setSelectedDrug(drug);
    Animated.timing(blurAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [blurAnim]);

  const closeMenu = useCallback(() => {
    Animated.timing(blurAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedDrug(null));
  }, [blurAnim]);

  const renderDrugCard = useCallback(({ item: drug, index }: { item: Drug; index: number }) => {
    const handlePress = () => {
      if (selectedDrug) {
        closeMenu();
      } else {
        navigation.navigate('DrugDetail', { drug });
      }
    };

    const isSelected = selectedDrug?.id === drug.id;

    return (
      <TouchableOpacity
        style={[
          styles.drugCard,
          isSelected && styles.selectedDrugCard,
        ]}
        onPress={handlePress}
        onLongPress={() => handleLongPress(drug)}
        delayLongPress={300}
        activeOpacity={selectedDrug ? 1 : 0.7}
      >
        <Text style={styles.drugName}>{drug.trade_name}</Text>
        <Text style={styles.drugIngredient}>{drug.active_ingredient}</Text>
      </TouchableOpacity>
    );
  }, [navigation, selectedDrug, closeMenu, handleLongPress]);

  // Calculate fixed item height for getItemLayout (matches drugCard style + margin)
  const ITEM_HEIGHT = 80; // Optimized height
  const getItemLayout = useCallback((data: ArrayLike<Drug> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const uniqueIngredients = useMemo(() => 
    [...new Set(drugs.map((d) => d.active_ingredient))]
  , [drugs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search Results</Text>
        <Text style={styles.subtitle}>
          "{query}" - {drugs.length} drugs found
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{uniqueIngredients.length}</Text>
            <Text style={styles.summaryLabel}>Active Ingredients</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{drugs.length}</Text>
            <Text style={styles.summaryLabel}>Drugs Found</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={drugs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDrugCard}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          getItemLayout={getItemLayout}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No drugs found</Text>
            </View>
          }
        />
      </View>

      {/* Blur Overlay and Action Menu */}
      {selectedDrug && (
        <Animated.View style={[
          styles.overlay,
          { opacity: blurAnim }
        ]}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
          <View style={styles.menuContainer}>
            <View style={styles.selectedCardPreview}>
              <Text style={styles.previewName}>{selectedDrug.trade_name}</Text>
              <Text style={styles.previewIngredient}>{selectedDrug.active_ingredient}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                navigation.navigate('DrugAlternatives', { drug: selectedDrug, mode: 'similar' });
              }}
            >
              <Text style={styles.menuItemText}>Similar</Text>
              <Text style={styles.menuItemSubtext}>Same active ingredient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                navigation.navigate('DrugAlternatives', { drug: selectedDrug, mode: 'alternatives' });
              }}
            >
              <Text style={styles.menuItemText}>Alternatives</Text>
              <Text style={styles.menuItemSubtext}>Same function, different ingredient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => {
                closeMenu();
                navigation.navigate('DrugDetail', { drug: selectedDrug });
              }}
            >
              <Text style={styles.menuItemText}>Details</Text>
              <Text style={styles.menuItemSubtext}>View full information</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  summaryCard: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: colors.primary.green,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h3,
    color: colors.neutral.white,
  },
  summaryLabel: {
    ...typography.small,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  drugCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.border.light,
    ...shadows.medium,
  },
  selectedDrugCard: {
    borderColor: colors.primary.green,
    borderWidth: 4,
    ...shadows.medium,
    zIndex: 100,
  },
  drugName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  drugIngredient: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.neutral.gray,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    zIndex: 1000,
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
  selectedCardPreview: {
    padding: spacing.lg,
    backgroundColor: colors.primary.green,
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
  menuItemText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  menuItemSubtext: {
    ...typography.body,
    color: colors.neutral.gray,
  },
});
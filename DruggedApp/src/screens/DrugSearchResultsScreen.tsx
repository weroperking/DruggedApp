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
} from 'react-native';
import { DrugActionMenu } from '../components/DrugActionMenu';
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

  const ITEM_HEIGHT = 80;
  const getItemLayout = useCallback((data: ArrayLike<Drug> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const uniqueIngredients = useMemo(() => 
    [...new Set(drugs.map((d) => d.active_ingredient))]
  , [drugs]);

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

      <DrugActionMenu
        drug={selectedDrug}
        visible={!!selectedDrug}
        onClose={closeMenu}
        blurAnim={blurAnim}
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
    padding: spacing.lg,
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
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  drugIngredient: {
    ...typography.body,
    color: colors.neutral.gray,
    lineHeight: 20,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.neutral.gray,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { Drug, getSimilarDrugs, getAlternativeDrugs } from '../services/drugDatabase';

type RootStackParamList = {
  DrugSearchResults: { drugs: Drug[]; query: string };
  DrugDetail: { drug: Drug };
  DrugAlternatives: { drug: Drug; mode: 'similar' | 'alternatives' };
};

type DrugAlternativesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugAlternatives'>;
  route: RouteProp<RootStackParamList, 'DrugAlternatives'>;
};

export const DrugAlternativesScreen: React.FC<DrugAlternativesScreenProps> = ({
  navigation,
  route,
}) => {
  const { drug, mode } = route.params;
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const results = mode === 'similar' 
          ? await getSimilarDrugs(drug.id)
          : await getAlternativeDrugs(drug.id);
        setDrugs(results);
      } finally {
        setLoading(false);
      }
    };
    
    loadDrugs();
  }, [drug.id, mode]);

  const renderDrugCard = (item: Drug) => (
    <TouchableOpacity
      style={styles.drugCard}
      onPress={() => navigation.navigate('DrugDetail', { drug: item })}
      activeOpacity={0.7}
    >
      <Text style={styles.drugName}>{item.trade_name}</Text>
      <Text style={styles.drugIngredient}>{item.active_ingredient}</Text>
    </TouchableOpacity>
  );

  const title = mode === 'similar' ? 'Similar Medicines' : 'Alternative Medicines';
  const subtitle = mode === 'similar' 
    ? 'Same active ingredient as ' + drug.trade_name
    : 'Same function, different active ingredient';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={drugs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => renderDrugCard(item)}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? 'Loading...' : 'No drugs found'}
              </Text>
            </View>
          }
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
});

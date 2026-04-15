import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../theme';
import { searchDrugs, initDatabase, getDrugCount, Drug, SearchField } from '../services/drugDatabase';

type RootStackParamList = {
  SectionSelect: undefined;
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  DrugSearch: undefined;
  DrugSearchResults: { drugs: Drug[]; query: string };
  Disclaimer: undefined;
};

type DrugSearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugSearch'>;
};

const SEARCH_MODES: { label: string; value: SearchField; placeholder: string }[] = [
  { label: 'All', value: 'all', placeholder: 'e.g., PANADOL, PARACETAMOL...' },
  { label: 'Trade Name', value: 'trade_name', placeholder: 'e.g., PANADOL, BRUFEN...' },
  { label: 'Ingredient', value: 'active_ingredient', placeholder: 'e.g., PARACETAMOL, IBUPROFEN...' },
  { label: 'Category', value: 'category', placeholder: 'e.g., ANALGESIC, SKIN CARE...' },
  { label: 'Manufacturer', value: 'manufacturer', placeholder: 'e.g., NOVARTIS, PFIZER...' },
  { label: 'Route', value: 'route', placeholder: 'e.g., ORAL, TOPICAL...' },
];

export const DrugSearchScreen: React.FC<DrugSearchScreenProps> = ({
  navigation,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Drug[]>([]);
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [error, setError] = useState<string | null>(null);
  const [drugCount, setDrugCount] = useState<number>(0);
  const inputRef = useRef<TextInput>(null);

  const currentMode = SEARCH_MODES.find(m => m.value === searchField)!;

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      console.log('[Search] Initializing database...');
      await initDatabase();
      const count = await getDrugCount();
      setDrugCount(count);
      console.log('[Search] Total drugs in DB:', count);
      console.log('[Search] Searching for:', q.trim(), 'in field:', searchField);
      const searchResults = await searchDrugs(q.trim(), searchField);
      console.log('[Search] Found results:', searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error('[Search] Error:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = () => {
    if (results.length > 0) {
      navigation.navigate('DrugSearchResults', { drugs: results, query });
    }
  };

  const renderQuickSearch = (title: string, searchTerm: string) => (
    <TouchableOpacity
      style={styles.quickSearchButton}
      onPress={() => {
        setQuery(searchTerm);
        setTimeout(() => handleSearch(searchTerm), 100);
      }}
    >
      <Text style={styles.quickSearchText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('SectionSelect')}
        >
          <Text style={styles.backText}>‹ Select Section</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drug Search</Text>
        {drugCount > 0 && (
          <Text style={styles.subtitle}>{drugCount} drugs in database</Text>
        )}
        <Text style={styles.subtitle}>
          Search by name, active ingredient, or category
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.modeScroll}
        contentContainerStyle={styles.modeContainer}
      >
        {SEARCH_MODES.map(mode => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.modeChip, searchField === mode.value && styles.modeChipActive]}
            onPress={() => { setSearchField(mode.value); setResults([]); }}
          >
            <Text style={[styles.modeChipText, searchField === mode.value && styles.modeChipTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={currentMode.placeholder}
          placeholderTextColor={colors.neutral.gray}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => handleSearch()}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
        </View>
      ) : (
        <>
          {results.length > 0 && (
            <View style={styles.resultsPreview}>
              <Text style={styles.resultsCount}>
                {results.length} results found
              </Text>
              <FlatList
                data={results.slice(0, 5)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultName}>{item.trade_name}</Text>
                    <Text style={styles.resultIngredient}>
                      {item.active_ingredient}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {[item.category, item.route].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.resultPrice}>
                        EGP {item.price.toFixed(2)}
                      </Text>
                      {item.price_old && item.price_old > item.price && (
                        <Text style={styles.priceOld}>
                          EGP {item.price_old.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              />
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewResults}
              >
                <Text style={styles.viewAllButtonText}>
                  View all {results.length} results
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.quickSearchSection}>
            <Text style={styles.quickSearchTitle}>Quick Searches</Text>
            <View style={styles.quickSearchGrid}>
              {renderQuickSearch('Pain Relief', 'PANADOL')}
              {renderQuickSearch('Antibiotics', 'AMOXICILLIN')}
              {renderQuickSearch('Allergy', 'CETIRIZINE')}
              {renderQuickSearch('Skin Care', 'SKIN')}
              {renderQuickSearch('Vitamins', 'VITAMIN')}
              {renderQuickSearch('Blood Pressure', 'BLOOD')}
            </View>
          </View>
        </>
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
  modeScroll: {
    maxHeight: 52,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  modeContainer: {
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeChip: {
    borderWidth: 2,
    borderColor: colors.border.dark,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral.white,
    marginRight: spacing.sm,
  },
  modeChipActive: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.darkGreen,
  },
  modeChipText: {
    ...typography.small,
    color: colors.neutral.charcoal,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: colors.neutral.white,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: 0,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 4,
    borderColor: colors.border.dark,
  },
  searchButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  searchButtonText: {
    ...typography.button,
  },
  errorContainer: {
    backgroundColor: colors.accent.red,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.small,
    color: colors.neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsPreview: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  resultsCount: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  resultItem: {
    backgroundColor: colors.neutral.white,
    borderWidth: 4,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resultName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  resultIngredient: {
    ...typography.small,
    color: colors.neutral.gray,
  },
  resultMeta: {
    ...typography.small,
    color: colors.neutral.gray,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  resultPrice: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary.green,
  },
  priceOld: {
    ...typography.small,
    color: colors.neutral.gray,
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  viewAllButton: {
    backgroundColor: colors.primary.darkGreen,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewAllButtonText: {
    ...typography.button,
  },
  quickSearchSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  quickSearchTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickSearchButton: {
    backgroundColor: colors.neutral.white,
    borderWidth: 4,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickSearchText: {
    ...typography.small,
    color: colors.neutral.charcoal,
    fontWeight: '600',
  },
});
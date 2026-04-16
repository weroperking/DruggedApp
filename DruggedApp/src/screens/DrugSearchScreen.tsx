import React, { useState, useRef, useEffect } from 'react';
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
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { searchDrugs, initDatabase, getDrugCount, Drug, SearchField } from '../services/drugDatabase';

type RootStackParamList = {
  SectionSelect: undefined;
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  DrugSearch: { drugCount: number };
  DrugSearchResults: { drugs: Drug[]; query: string };
  DrugDetail: { drug: Drug };
  Disclaimer: undefined;
};

import { RouteProp } from '@react-navigation/native';

type DrugSearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugSearch'>;
  route: RouteProp<RootStackParamList, 'DrugSearch'>;
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
  route,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Drug[]>([]);
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const drugCount = route.params?.drugCount ?? 0;
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMode = SEARCH_MODES.find(m => m.value === searchField)!;

  // Debounce search query changes
  useEffect(() => {
    // Clear any existing pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search for empty queries
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Schedule new search after 300ms delay
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    // Cleanup timeout on unmount or when query changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, searchField]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setResults([]);
    setError(null);
    try {
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
        setTimeout(async () => {
          setLoading(true);
          setResults([]);
          setError(null);
          try {
            console.log('[QuickSearch] Searching for:', searchTerm.trim(), 'in field: all');
            const searchResults = await searchDrugs(searchTerm.trim(), 'all');
            console.log('[QuickSearch] Found results:', searchResults.length);
            setResults(searchResults);
          } catch (error) {
            console.error('[QuickSearch] Error:', error);
            setError(String(error));
          } finally {
            setLoading(false);
          }
        }, 100);
      }}
    >
      <Text style={styles.quickSearchText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.dropdownContainer}>
          <Pressable
            style={styles.dropdownButton}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={styles.dropdownButtonText}>
              Search by: {currentMode.label}
            </Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </Pressable>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {SEARCH_MODES.map(mode => (
                <Pressable
                  key={mode.value}
                  style={[
                    styles.dropdownItem,
                    searchField === mode.value && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSearchField(mode.value);
                    setResults([]);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    searchField === mode.value && styles.dropdownItemTextActive
                  ]}>
                    {mode.label}
                  </Text>
                  {searchField === mode.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

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
                {results.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id.toString()}
                    style={styles.resultItem}
                    onPress={() => navigation.navigate('DrugDetail', { drug: item })}
                    activeOpacity={0.7}
                  >
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
                  </TouchableOpacity>
                ))}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  dropdownContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    zIndex: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.dark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  dropdownButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral.charcoal,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.neutral.gray,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: spacing.lg,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.dark,
    borderRadius: borderRadius.lg,
    zIndex: 200,
    elevation: 4,
    ...shadows.medium,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary.green + '15',
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.neutral.charcoal,
  },
  dropdownItemTextActive: {
    color: colors.primary.darkGreen,
    fontWeight: '700',
  },
  checkmark: {
    color: colors.primary.green,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 3,
    borderColor: colors.border.dark,
    minHeight: 56,
  },
  searchButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 3,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
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
    paddingTop: spacing.lg,
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
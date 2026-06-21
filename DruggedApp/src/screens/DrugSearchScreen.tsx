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
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows, layout } from '../theme';
import { searchDrugs, Drug, SearchField } from '../services/drugDatabase';
import { RootStackParamList } from '../navigation/types';

type DrugSearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DrugSearch'>;
  route: RouteProp<RootStackParamList, 'DrugSearch'>;
};

const SEARCH_MODES: { label: string; value: SearchField; placeholder: string }[] = [
  { label: 'All', value: 'all', placeholder: 'e.g., PANADOL, t*a*x for topamax...' },
  { label: 'Trade Name', value: 'trade_name', placeholder: 'e.g., PANADOL, t*a*x for topamax...' },
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
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [blurAnim] = useState(new Animated.Value(0));

  const handleLongPress = (drug: Drug) => {
    setSelectedDrug(drug);
    Animated.timing(blurAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(blurAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedDrug(null));
  };

  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSearchId = useRef(0);

  const currentMode = SEARCH_MODES.find(m => m.value === searchField)!;

  const runSearch = React.useCallback(async (rawQuery: string, field: SearchField) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setResults([]);
      setError('Enter a search term.');
      return;
    }

    const searchId = ++activeSearchId.current;
    setLoading(true);
    setResults([]);
    setError(null);

    try {
      console.log('[Search] Searching for:', trimmed, 'in field:', field);
      const searchResults = await searchDrugs(trimmed, field);
      if (searchId !== activeSearchId.current) return;
      console.log('[Search] Found results:', searchResults.length);
      setResults(searchResults);
    } catch (error) {
      if (searchId !== activeSearchId.current) return;
      console.error('[Search] Error:', error);
      setError('Search failed. Please try again.');
    } finally {
      if (searchId === activeSearchId.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce search query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      runSearch(query, searchField);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, searchField, runSearch]);

  const handleViewResults = () => {
    if (results.length > 0) {
      navigation.navigate('DrugSearchResults', { drugs: results, query });
    }
  };

  const renderQuickSearch = (title: string, searchTerm: string) => (
    <TouchableOpacity
      style={styles.quickSearchButton}
      onPress={() => {
        setSearchField('all');
        setQuery(searchTerm);
      }}
      activeOpacity={0.8}
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
            onSubmitEditing={() => runSearch(query, searchField)}
            returnKeyType="search"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => runSearch(query, searchField)}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.green} />
          </View>
        ) : (
          <>
            {results.length > 0 && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsCount}>
                    Found {results.length} results
                  </Text>
                </View>
                {results.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id.toString()}
                    style={[
                      styles.resultItem,
                      selectedDrug?.id === item.id && styles.selectedResultItem,
                    ]}
                    onPress={() => {
                      if (selectedDrug) {
                        closeMenu();
                      } else {
                        navigation.navigate('DrugDetail', { drug: item });
                      }
                    }}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={300}
                    activeOpacity={selectedDrug ? 1 : 0.7}
                  >
                    <Text style={styles.resultName}>{item.trade_name}</Text>
                    <Text style={styles.resultIngredient}>
                      {item.active_ingredient}
                    </Text>
                    <Text style={styles.resultMeta}>
                      {[item.category, item.route].filter(Boolean).join(' · ')}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={handleViewResults}
                  activeOpacity={0.8}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    maxWidth: layout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.sm,
  },
  dropdownContainer: {
    marginBottom: spacing.md,
    zIndex: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.medium,
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
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    zIndex: 200,
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
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body,
    borderWidth: 3,
    borderColor: colors.border.light,
    minHeight: 56,
    ...shadows.medium,
  },
  searchButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
    ...shadows.medium,
  },
  searchButtonText: {
    ...typography.button,
  },
  errorBanner: {
    backgroundColor: colors.accent.red,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.accent.red,
  },
  errorText: {
    ...typography.small,
    color: colors.neutral.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  resultsSection: {
    marginBottom: spacing.lg,
  },
  resultsHeader: {
    marginBottom: spacing.md,
  },
  resultsCount: {
    ...typography.body,
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  resultName: {
    ...typography.h3,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  resultIngredient: {
    ...typography.body,
    color: colors.neutral.gray,
    lineHeight: 20,
  },
  resultMeta: {
    ...typography.small,
    color: colors.neutral.gray,
    marginTop: spacing.xs,
  },
  viewAllButton: {
    backgroundColor: colors.primary.green,
    borderWidth: 4,
    borderColor: colors.primary.darkGreen,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.medium,
  },
  viewAllButtonText: {
    ...typography.button,
  },
  quickSearchSection: {
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
    borderWidth: 3,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  quickSearchText: {
    ...typography.small,
    color: colors.neutral.charcoal,
    fontWeight: '600',
  },
  selectedResultItem: {
    borderColor: colors.primary.green,
    borderWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    zIndex: 100,
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
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography, borderRadius } from '../theme';
import { searchDrugs, initDatabase, Drug } from '../services/drugDatabase';

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

export const DrugSearchScreen: React.FC<DrugSearchScreenProps> = ({
  navigation,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Drug[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    setLoading(true);
    setResults([]);
    try {
      console.log('[Search] Initializing database...');
      await initDatabase();
      console.log('[Search] Database initialized, searching for:', q.trim());
      const searchResults = await searchDrugs(q.trim());
      console.log('[Search] Results:', searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error('[Search] Error:', error);
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
        <Text style={styles.subtitle}>
          Search by name, active ingredient, or category
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="e.g., PANADOL, AMOXICILLIN"
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
                    <Text style={styles.resultPrice}>
                      EGP {item.price.toFixed(2)}
                    </Text>
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
  resultPrice: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary.green,
    marginTop: spacing.xs,
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
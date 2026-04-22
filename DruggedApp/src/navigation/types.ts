import { Drug } from '../services/drugDatabase';

export type RootStackParamList = {
  SectionSelect: undefined;
  Home: undefined;
  UserInfo: { symptom: string };
  Results: { symptom: string; age: number; sex: string; pregnancy: boolean };
  DrugSearch: { drugCount?: number };
  DrugSearchResults: { drugs: Drug[]; query: string };
  DrugDetail: { drug: Drug };
  DrugAlternatives: { drug: Drug; mode: 'similar' | 'alternatives' };
  Disclaimer: undefined;
  Menu: undefined;
  Donation: undefined;
};
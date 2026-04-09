import drugData from '../../drugged_otc_data.json';

export interface UserConstraints {
  age: number;
  sex: 'male' | 'female';
  pregnancy: boolean;
  symptom: string;
}

export interface OTCOption {
  ingredient: typeof drugData.ingredients[0];
  riskLevel: 'safe' | 'caution' | 'avoid';
  firstLine: boolean;
}

const checkAgeRestriction = (
  minAge: number,
  userAge: number,
): boolean => {
  return userAge >= minAge;
};

const checkPregnancyRule = (
  rule: string,
  isPregnant: boolean,
): { allowed: boolean; requiresWarning: boolean } => {
  switch (rule) {
    case 'allowed':
      return { allowed: true, requiresWarning: false };
    case 'caution':
      if (isPregnant) {
        return { allowed: true, requiresWarning: true };
      }
      return { allowed: true, requiresWarning: false };
    case 'avoid':
      if (isPregnant) {
        return { allowed: false, requiresWarning: true };
      }
      return { allowed: true, requiresWarning: false };
    default:
      return { allowed: true, requiresWarning: false };
  }
};

export const getSafeOTCOptions = (
  constraints: UserConstraints,
): OTCOption[] => {
  const { age, pregnancy, symptom } = constraints;
  const symptomData = drugData.symptoms[symptom as keyof typeof drugData.symptoms];

  if (!symptomData) {
    return [];
  }

  const linkedIngredients = symptomData.linked_ingredients;
  const firstLine = symptomData.first_line || [];
  const results: OTCOption[] = [];

  linkedIngredients.forEach((ingredientName: string) => {
    const ingredient = drugData.ingredients.find(
      (i: typeof drugData.ingredients[0]) => i.name === ingredientName,
    );

    if (!ingredient) return;

    const ageCheck = checkAgeRestriction(ingredient.min_age, age);
    const pregnancyCheck = checkPregnancyRule(ingredient.pregnancy_rule, pregnancy);

    if (!ageCheck || !pregnancyCheck.allowed) {
      results.push({
        ingredient,
        riskLevel: 'avoid',
        firstLine: firstLine.includes(ingredientName),
      });
      return;
    }

    if (pregnancyCheck.requiresWarning) {
      results.push({
        ingredient,
        riskLevel: 'caution',
        firstLine: firstLine.includes(ingredientName),
      });
      return;
    }

    results.push({
      ingredient,
      riskLevel: 'safe',
      firstLine: firstLine.includes(ingredientName),
    });
  });

  return results.sort((a, b) => {
    if (a.firstLine !== b.firstLine) {
      return a.firstLine ? -1 : 1;
    }
    return 0;
  });
};

export const getSymptomsList = (): string[] => {
  return Object.keys(drugData.symptoms);
};

export const getDisclaimer = (): string => {
  return drugData.metadata.disclaimer;
};
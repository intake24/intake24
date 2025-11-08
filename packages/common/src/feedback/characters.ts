import { localeTranslation } from '../types/common';
import { z } from '../util';
import { sentiments } from './shared';

export enum NutrientTypeIdEnum {
  Energy = '1',
  Carbohydrate = '13',
  Protein = '11',
  TotalFat = '49',
  Sugar = '23',
  SatdFat = '50',
  Fibre = '15',
  VitaminA = '120',
  Calcium = '140',
  VitaminC = '129',
  Iron = '143',
  Folate = '134',
  CO2 = '228',
  TotalFreeSugars = '251',
  AOACFibre = '242',
}

export const characterSentimentTypes = ['danger', 'warning', 'happy', 'exciting'] as const;
export type CharacterSentimentType = (typeof characterSentimentTypes)[number];

export const characterSentiment = z.object({
  sentiment: z.enum(sentiments).array(),
  sentimentType: z.enum(characterSentimentTypes),
  name: localeTranslation,
});

export type CharacterSentiment = z.infer<typeof characterSentiment>;

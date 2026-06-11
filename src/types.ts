/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PropertyCondition = 'nuovo' | 'recente' | 'ristrutturato' | 'buono' | 'da-ristrutturare';
export type FloorOption = 'terra' | 'rialzato' | 'intermedio' | 'alto-senza' | 'ultimo' | 'attico' | 'primo-senza' | 'secondo-senza' | 'terzo-senza';
export type ExposureOption = 'interna' | 'esterna' | 'doppia' | 'panoramica';
export type PropertyTaglio = 'monolocale' | '1-locale' | '2-locali' | '3-locali' | '4-locali' | '5-piu-locali' | 'villa' | 'villa-bifamiliare' | 'villino-schiera' | 'casa-campagna' | 'casa-indipendente';

export interface AccessoriesInput {
  hasBalcone: boolean;
  balconeSize: number;
  hasTerrazzo: boolean;
  terrazzoSize: number;
  hasBox: boolean;
  hasBoxDoppio: boolean;
  hasPostoCoperto: boolean;
  hasPostoScoperto: boolean;
  hasCantina: boolean;
  cantinaSize: number;
  hasSoffitta: boolean;
  soffittaSize: number;
  hasGiardino: boolean;
  giardinoSize: number;
}

export interface FloorDetails {
  id: FloorOption;
  label: string;
  multiplier: number;
}

export interface ExposureDetails {
  id: ExposureOption;
  label: string;
  multiplier: number;
}

export interface ConditionDetails {
  id: PropertyCondition;
  label: string;
  description: string;
  colorClass: string;      // Tailwind text/bg colors
  badgeClass: string;      // Tailwind badge colors
  gradientClass: string;   // Tailwind gradient card
  multiplier: number;      // Multiplier relative to "Nuovo" (which is 1.0)
  ageRange: string;
}

export interface MarketEstimate {
  condition: PropertyCondition;
  minPricePerSqM: number;
  maxPricePerSqM: number;
  avgPricePerSqM: number;
  estimatedTotal: number;
  tecnocasaPrice?: number;
  frimmPrice?: number;
  operatoriAvg?: number;
  omiPrice?: number;
  omiMinPrice?: number;
  omiMaxPrice?: number;
}

export interface ZoneData {
  name: string;
  city: string;
  tier: 'milano' | 'roma' | 'second_tier' | 'province';
  basePriceMin: number; // For "Nuovo"
  basePriceMax: number; // For "Nuovo"
  description?: string;
}

export interface SearchResult {
  zoneName: string;
  cityName: string;
  tierLabel: string;
  selectedCondition: PropertyCondition;
  selectedSize: number;
  selectedTaglio?: PropertyTaglio;
  selectedFloor?: FloorOption;
  selectedExposure?: ExposureOption;
  accessories?: AccessoriesInput;
  commercialSize?: number;
  estimates: MarketEstimate[]; // All conditions for comparison
}

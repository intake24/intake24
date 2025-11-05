export interface PkgNutrientTableCsvMapping {
  rowOffset: number;
  idColumnOffset: number;
  descriptionColumnOffset: number;
  localDescriptionColumnOffset?: number;
}

export interface PkgNutrientTableNutrientCsvMapping {
  nutrientTypeId: string;
  columnOffset: number;
}

export interface PkgNutrientTableFieldCsvMapping {
  fieldName: string;
  columnOffset: number;
}

export type PkgNutrientTableRecord = {
  recordId: string;
  name: string;
  localName?: string;
  nutrients: [string, number][];
  fields: [string, string][];
};

export interface PkgNutrientTable {
  id: string;
  description: string;
  csvMapping: PkgNutrientTableCsvMapping;
  csvNutrientMapping: PkgNutrientTableNutrientCsvMapping[];
  csvFieldMapping: PkgNutrientTableFieldCsvMapping[];
  records: PkgNutrientTableRecord[];
}

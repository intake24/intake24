// Placed into free gap slots before the first nutrient column so the importer
// ignores them — it only reads positions declared in nutrient_table_csv_mapping*.
export const EXTRA_HEADERS = [
  'Food code',
  'Food ID',
  'Locale',
  'English name',
  'Local name',
  'Sub-group code',
  'Alternative Name',
  'Tags',
] as const;

export type NdbCsvMappingConfig = {
  idColumnOffset: number;
  descriptionColumnOffset: number;
  localDescriptionColumnOffset: number | null;
};

export type NdbMappingNutrient = {
  columnOffset: number;
  nutrientTypeId: string | number;
};

export type NdbCsvLayout = {
  fields: { label: string; value: string }[];
  offsetByNutrientType: Map<string, number>;
  // Maps column position → EXTRA_HEADERS index for each assigned extra column.
  extraFieldsByPos: Map<number, number>;
};

export type NdbRowFood = {
  id: string | number;
  code: string;
  localeId: string;
  englishName: string;
  name?: string | null;
  altNames?: Record<string, string[]>;
  tags?: string[];
};

export type NdbRowNtr = {
  nutrientTableRecordId: string;
  name: string;
  localName?: string | null;
  nutrients?: Array<{ nutrientTypeId?: string | number | null; unitsPer100g: number }>;
  fields?: Array<{ name: string; value: string }>;
};

export function buildNdbCsvLayout(
  csvMapping: NdbCsvMappingConfig,
  mappingNutrients: NdbMappingNutrient[],
  nutrientTypeById: Map<string, string>,
): NdbCsvLayout {
  const { idColumnOffset, descriptionColumnOffset, localDescriptionColumnOffset } = csvMapping;

  // Only id/desc/localDesc need to be excluded from free-slot search;
  // nutrient offsets are all >= minNutrientOffset so they can never appear in the search range.
  const occupied = new Set<number>([idColumnOffset, descriptionColumnOffset]);
  if (localDescriptionColumnOffset !== null)
    occupied.add(localDescriptionColumnOffset);

  const minNutrientOffset = mappingNutrients.length > 0
    ? Math.min(...mappingNutrients.map(n => n.columnOffset))
    : 0; // no nutrients → no free slots to search

  const maxMappingOffset = Math.max(
    idColumnOffset,
    descriptionColumnOffset,
    localDescriptionColumnOffset ?? 0,
    ...mappingNutrients.map(n => n.columnOffset),
  );

  // Collect free slots before the first nutrient column in ascending order.
  const freeSlots: number[] = [];
  for (let i = 0; i < minNutrientOffset; i++) {
    if (!occupied.has(i))
      freeSlots.push(i);
  }

  // Assign extra headers to free slots; silently drop any that don't fit.
  const extraFieldsByPos = new Map<number, number>();
  for (let i = 0; i < Math.min(EXTRA_HEADERS.length, freeSlots.length); i++)
    extraFieldsByPos.set(freeSlots[i], i);

  const posToLabel = new Map<number, string>();
  posToLabel.set(idColumnOffset, 'FCT record ID');
  posToLabel.set(descriptionColumnOffset, 'ntr.name');
  if (localDescriptionColumnOffset !== null)
    posToLabel.set(localDescriptionColumnOffset, 'Local name');
  for (const n of mappingNutrients)
    posToLabel.set(n.columnOffset, nutrientTypeById.get(n.nutrientTypeId.toString()) ?? '');
  for (const [colPos, extraIndex] of extraFieldsByPos)
    posToLabel.set(colPos, EXTRA_HEADERS[extraIndex]);

  // Gap columns (empty label, numeric value) must be included so that @json2csv
  // emits the correct column count; missing positions would shift subsequent columns.
  const fields: { label: string; value: string }[] = [];
  for (let i = 0; i <= maxMappingOffset; i++)
    fields.push({ label: posToLabel.get(i) ?? '', value: String(i) });

  const offsetByNutrientType = new Map(
    mappingNutrients.map(n => [n.nutrientTypeId.toString(), n.columnOffset]),
  );

  return { fields, offsetByNutrientType, extraFieldsByPos };
}

function getExtraValue(food: NdbRowFood, ntr: NdbRowNtr, index: number): string {
  switch (index) {
    case 0: return food.code; // Food code
    case 1: return food.id.toString(); // Food ID
    case 2: return food.localeId; // Locale
    case 3: return food.englishName; // English name
    case 4: return food.name ?? ''; // Local name
    case 5: return ntr.fields?.filter(f => f.name === 'sub_group_code').map(f => f.value).join(', ') ?? ''; // Sub-group code
    case 6: return Object.values(food.altNames ?? {}).flatMap(names => names).toSorted().join(', '); // Alternative Name
    case 7: return (food.tags ?? []).toSorted().join(', '); // Tags
    default: return '';
  }
}

export function buildNdbRow(
  food: NdbRowFood,
  ntr: NdbRowNtr,
  layout: NdbCsvLayout,
  csvMapping: NdbCsvMappingConfig,
): Record<string, string> {
  const { idColumnOffset, descriptionColumnOffset, localDescriptionColumnOffset } = csvMapping;
  const { offsetByNutrientType, extraFieldsByPos } = layout;

  const obj: Record<string, string> = {};

  obj[String(idColumnOffset)] = ntr.nutrientTableRecordId;
  obj[String(descriptionColumnOffset)] = ntr.name;
  if (localDescriptionColumnOffset !== null)
    obj[String(localDescriptionColumnOffset)] = ntr.localName ?? food.name ?? '';

  for (const n of ntr.nutrients ?? []) {
    if (n.nutrientTypeId == null)
      continue;
    const offset = offsetByNutrientType.get(n.nutrientTypeId.toString());
    if (offset !== undefined)
      obj[String(offset)] = n.unitsPer100g.toString();
  }

  for (const [colPos, extraIndex] of extraFieldsByPos)
    obj[String(colPos)] = getExtraValue(food, ntr, extraIndex);

  return obj;
}

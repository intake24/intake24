import { buildNdbCsvLayout, buildNdbRow } from './ndb-csv-layout';

describe('buildNdbCsvLayout', () => {
  it('places id and description at configured offsets', () => {
    const { fields } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 5, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(fields[0]).toEqual({ label: 'FCT record ID', value: '0' });
    expect(fields[1]).toEqual({ label: 'ntr.name', value: '1' });
  });

  it('includes local description column when configured', () => {
    const { fields } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: 2 },
      [{ columnOffset: 5, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(fields[2]).toEqual({ label: 'Local name', value: '2' });
  });

  it('fills free slots before first nutrient with extra headers in order', () => {
    // id=0, desc=1, nutrient at 5 → free slots: 2, 3, 4
    const { fields, extraFieldsByPos } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 5, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(fields[2].label).toBe('Food code');
    expect(fields[3].label).toBe('Food ID');
    expect(fields[4].label).toBe('Locale');
    expect(extraFieldsByPos.get(2)).toBe(0); // EXTRA_HEADERS[0] = 'Food code'
    expect(extraFieldsByPos.get(3)).toBe(1);
    expect(extraFieldsByPos.get(4)).toBe(2);
  });

  it('discards extra headers that exceed available free slots', () => {
    // id=0, desc=1, nutrient at 3 → only 1 free slot: 2
    const { extraFieldsByPos } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 3, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(extraFieldsByPos.size).toBe(1);
    expect(extraFieldsByPos.get(2)).toBe(0); // only 'Food code' fits
  });

  it('produces no extra columns when no nutrient mappings exist', () => {
    // No nutrients → minNutrientOffset clamped to 0 → free-slot loop does not run
    const { extraFieldsByPos, fields } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [],
      new Map(),
    );
    expect(extraFieldsByPos.size).toBe(0);
    expect(fields.length).toBe(2); // only id and desc columns
  });

  it('produces no extra columns when first nutrient is at position 0', () => {
    const { extraFieldsByPos } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 0, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(extraFieldsByPos.size).toBe(0);
  });

  it('fields array ends at maxMappingOffset, not extended beyond', () => {
    const { fields } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 5, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(fields.length).toBe(6); // columns 0–5
  });

  it('builds offsetByNutrientType map correctly', () => {
    const { offsetByNutrientType } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [
        { columnOffset: 10, nutrientTypeId: '5' },
        { columnOffset: 11, nutrientTypeId: 6 }, // numeric id
      ],
      new Map([['5', 'Energy'], ['6', 'Protein']]),
    );
    expect(offsetByNutrientType.get('5')).toBe(10);
    expect(offsetByNutrientType.get('6')).toBe(11); // numeric id coerced to string
  });

  it('handles nutrient at offset lower than id/description offsets', () => {
    // id=5, desc=6, nutrient at 2 → free slots before position 2: [0, 1]
    const { extraFieldsByPos, fields } = buildNdbCsvLayout(
      { idColumnOffset: 5, descriptionColumnOffset: 6, localDescriptionColumnOffset: null },
      [{ columnOffset: 2, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(extraFieldsByPos.size).toBe(2); // slots 0 and 1 are free
    expect(extraFieldsByPos.get(0)).toBe(0); // Food code
    expect(extraFieldsByPos.get(1)).toBe(1); // Food ID
    expect(fields[2]).toEqual({ label: 'Energy', value: '2' });
    expect(fields[5]).toEqual({ label: 'FCT record ID', value: '5' });
  });

  it('uses all 8 extra headers when 8+ free slots exist', () => {
    // id=0, desc=1, first nutrient at 10 → 8 free slots: 2-9
    const { extraFieldsByPos } = buildNdbCsvLayout(
      { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null },
      [{ columnOffset: 10, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    expect(extraFieldsByPos.size).toBe(8);
    // verify order: slot 2 → index 0 (Food code) … slot 9 → index 7 (Tags)
    for (let i = 0; i < 8; i++)
      expect(extraFieldsByPos.get(2 + i)).toBe(i);
  });
});

describe('buildNdbRow', () => {
  // id=0, desc=1, free slots 2-4 before nutrient at 5
  const mapping = { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null };
  const layout = buildNdbCsvLayout(
    mapping,
    [{ columnOffset: 5, nutrientTypeId: '1' }],
    new Map([['1', 'Energy']]),
  );
  const food = {
    id: 42,
    code: 'APPL',
    localeId: 'UK_current',
    englishName: 'Apple',
    name: 'Apple UK',
    altNames: { en: ['apple', 'Apple'] },
    tags: ['fruit'],
  };
  const ntr = {
    nutrientTableRecordId: 'NDB001',
    name: 'Apple NDB',
    localName: null,
    nutrients: [{ nutrientTypeId: '1', unitsPer100g: 52 }],
    fields: [],
  };

  it('places NTR id at idColumnOffset', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['0']).toBe('NDB001');
  });

  it('places NTR name at descriptionColumnOffset', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['1']).toBe('Apple NDB');
  });

  it('places nutrient value at configured offset', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['5']).toBe('52');
  });

  it('places Food code at first free slot (column 2)', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['2']).toBe('APPL');
  });

  it('places Food ID at second free slot (column 3)', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['3']).toBe('42');
  });

  it('places Locale at third free slot (column 4)', () => {
    expect(buildNdbRow(food, ntr, layout, mapping)['4']).toBe('UK_current');
  });

  it('omits unmapped nutrient type — no key written for that type', () => {
    const ntrExtra = { ...ntr, nutrients: [{ nutrientTypeId: '99', unitsPer100g: 5 }] };
    const row = buildNdbRow(food, ntrExtra, layout, mapping);
    expect(row['5']).toBeUndefined(); // offset 5 was mapped to type '1', not '99'
    expect(Object.keys(row)).not.toContain('99');
  });

  it('skips nutrients with null nutrientTypeId', () => {
    const ntrNull = { ...ntr, nutrients: [{ nutrientTypeId: null, unitsPer100g: 5 }] };
    const row = buildNdbRow(food, ntrNull, layout, mapping);
    expect(row['5']).toBeUndefined();
  });

  it('includes local description when localDescriptionColumnOffset is set', () => {
    const mappingLocal = { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: 2 };
    // nutrient at 10 → free slots before 10: [3..9] (2 occupied by localDesc)
    const layoutLocal = buildNdbCsvLayout(
      mappingLocal,
      [{ columnOffset: 10, nutrientTypeId: '1' }],
      new Map([['1', 'Energy']]),
    );
    const ntrLocal = { ...ntr, localName: 'Pomme' };
    const row = buildNdbRow(food, ntrLocal, layoutLocal, mappingLocal);
    expect(row['2']).toBe('Pomme');
    expect(row['3']).toBe('APPL'); // Food code at first free slot after localDesc
  });

  it('falls back to food.name when localName is null', () => {
    const mappingLocal = { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: 2 };
    const layoutLocal = buildNdbCsvLayout(mappingLocal, [{ columnOffset: 5, nutrientTypeId: '1' }], new Map([['1', 'Energy']]));
    const row = buildNdbRow(food, { ...ntr, localName: null }, layoutLocal, mappingLocal);
    expect(row['2']).toBe('Apple UK'); // food.name fallback
  });

  it('does not place sub_group_code when fewer than 6 free slots exist', () => {
    // Only 3 free slots (2,3,4) → indices 0-2 assigned; index 5 (sub_group_code) dropped
    const ntrFields = {
      ...ntr,
      fields: [{ name: 'sub_group_code', value: 'A' }, { name: 'sub_group_code', value: 'B' }],
    };
    const row = buildNdbRow(food, ntrFields, layout, mapping);
    expect(Object.keys(row)).not.toContain(String(layout.extraFieldsByPos.size + 5)); // index 5 slot never assigned
    expect(Object.values(row)).not.toContain('A, B');
  });

  it('sorts and joins altNames across locales', () => {
    // id=0, desc=1, first nutrient at 10 → 8 free slots (2-9); altNames = index 6 → slot 8
    const mappingWide = { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null };
    const layoutWide = buildNdbCsvLayout(mappingWide, [{ columnOffset: 10, nutrientTypeId: '1' }], new Map([['1', 'Energy']]));
    const foodAlt = { ...food, altNames: { en: ['apple'], fr: ['pomme', 'Apple'] } };
    const row = buildNdbRow(foodAlt, ntr, layoutWide, mappingWide);
    expect(row['8']).toBe('Apple, apple, pomme'); // sorted across locales
  });

  it('sorts and joins tags', () => {
    // tags = index 7 → slot 9
    const mappingWide = { idColumnOffset: 0, descriptionColumnOffset: 1, localDescriptionColumnOffset: null };
    const layoutWide = buildNdbCsvLayout(mappingWide, [{ columnOffset: 10, nutrientTypeId: '1' }], new Map([['1', 'Energy']]));
    const foodTags = { ...food, tags: ['vegetable', 'apple', 'fruit'] };
    const row = buildNdbRow(foodTags, ntr, layoutWide, mappingWide);
    expect(row['9']).toBe('apple, fruit, vegetable');
  });
});

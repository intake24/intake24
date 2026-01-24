# Malaysian Food Import Guide

This guide covers importing Malaysian food data into Intake24, with special handling for multi-language translations (Malay, Tamil, Mandarin).

## Overview

Malaysian locales require special handling because:

1. **Multiple languages** per locale (English + Malay/Tamil/Mandarin)
2. **Separate CSV columns** for each language's translations
3. **Associated foods** need translations merged from multiple columns

## Supported Locales

| Locale ID    | Language | Description Column            | Associated Foods Column                 |
| ------------ | -------- | ----------------------------- | --------------------------------------- |
| `ms_MY_2024` | Malay    | `Local Description(Malay)`    | `Associated Food / Category (Malay)`    |
| `ta_MY_2024` | Tamil    | `Local Description(Tamil)`    | `Associated Food / Category (Tamil)`    |
| `zh_MY_2024` | Mandarin | `Local Description(Mandarin)` | `Associated Food / Category (Mandarin)` |

## CSV Column Structure

### Required Columns

| Column                                    | Description                                     |
| ----------------------------------------- | ----------------------------------------------- |
| `Intake24 Code`                           | Unique food code                                |
| `Action`                                  | 1=delete, 2=update, 3=update categories, 5=skip |
| `English Description`                     | English name (required)                         |
| `Local Description(Malay/Tamil/Mandarin)` | Language-specific name                          |
| `Food Composition Table`                  | e.g., `AUSNUT`                                  |
| `Food Composition Record ID`              | e.g., `01A30191`                                |

### Associated Foods Format

**English Column** (`Associated Food / Category`):

```
DRNK(Did you have a drink with your meal?)
```

**Language Column** (`Associated Food / Category (Malay)`):

```
DRNK({ms: Adakah anda mengambil minuman bersama hidangan anda?})
```

The import automatically **merges** these into:

```json
{
  "en": "Did you have a drink with your meal?",
  "ms": "Adakah anda mengambil minuman bersama hidangan anda?"
}
```

### Special Values

- `Inherited` - Keep existing associated foods (don't update)
- `FALSE` - No associated foods for this item

## Import Commands

### Malay Locale (ms_MY_2024)

```bash
cd apps/cli
pnpm cli import-foods \
  -i /path/to/malay-food-list.csv \
  -l ms_MY_2024 \
  --batch-size 100 \
  --new-food-action 5 \
  --preset malaysia
```

### Tamil Locale (ta_MY_2024)

```bash
cd apps/cli
pnpm cli import-foods \
  -i /path/to/tamil-food-list.csv \
  -l ta_MY_2024 \
  --batch-size 100 \
  --new-food-action 5 \
  --preset malaysia
```

## Translation Merging Logic

The import process:

1. **Reads locale-specific column** (e.g., `Associated Food / Category (Malay)`)
   - Parses format: `CODE({ms: Malay text here})`
   - Extracts: `{ms: "Malay text here"}`

2. **Reads English column** (`Associated Food / Category`)
   - Parses format: `CODE(English text here)`
   - Extracts: `"English text here"`

3. **Merges by food code**:
   ```json
   {
     "en": "English text here",
     "ms": "Malay text here"
   }
   ```

This ensures the admin UI shows **both language tabs** (English + Malay/Tamil) for associated food prompts.

## Troubleshooting

### Associated foods only show one language

**Cause**: The English column is empty or has `FALSE`/`Inherited`

**Fix**: Ensure both columns have matching food codes:

- English: `DRNK(Did you have a drink?)`
- Malay: `DRNK({ms: Adakah anda minum?})`

### Associated foods show "ms:" in English field

**Cause**: Old data with buggy regex parsing

**Fix**: Run SQL to correct existing data:

```sql
UPDATE associated_foods
SET
  generic_name = regexp_replace(generic_name, '"en":"(ms|ta): ', '"\1":"', 'g'),
  text = regexp_replace(text, '"en":"(ms|ta): ', '"\1":"', 'g')
WHERE locale_id = 'ms_MY_2024'
  AND (generic_name LIKE '%"en":"ms:%' OR text LIKE '%"en":"ms:%');
```

### Foods marked "Inherited" not updating

**Expected behavior**: `Inherited` means "keep existing data, don't update from CSV"

**Fix**: To update these foods, replace `Inherited` with actual associated food data in the CSV.

## Verification

### Using verify-consistency command

The `verify-consistency` command now checks translation completeness for Malaysian locales:

```bash
cd apps/cli
pnpm cli verify-consistency \
  -i /path/to/malay-food-list.csv \
  -l ms_MY_2024 \
  --check-associated-foods
```

This will verify:

- Associated food codes match between CSV and database
- Both English AND locale-specific translations exist in database
- Reports `translation_mismatch` issues if languages are missing

### Manual database verification

```sql
-- Check associated foods format
SELECT food_code, generic_name, text
FROM associated_foods
WHERE locale_id = 'ms_MY_2024'
LIMIT 5;

-- Should show: {"en":"...", "ms":"..."} format

-- Find records missing translations
SELECT food_code, text
FROM associated_foods
WHERE locale_id = 'ms_MY_2024'
  AND (text::text NOT LIKE '%"en":%' OR text::text NOT LIKE '%"ms":%');
```

## Related Documentation

- [Japanese Food Import Guide](./Japanese-Food-Import-Guide.md)
- [Verify Consistency Command](./verify-consistency-command.md)

# Intake24 CLI Quick Reference

Quick reference for common food import operations.

## CSV as Source of Truth

### Making CSV the Authoritative Source

```bash
# 1. Check current state
pnpm cli verify-consistency \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  -r consistency-report.json

# 2. Sync database with CSV (dry run first)
pnpm cli sync-foods \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  --dry-run

# 3. Apply sync
pnpm cli sync-foods \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  --enable-all \
  -r sync-report.json

# 4. Verify sync completed
pnpm cli verify-consistency \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  -r after-sync.json
```

### Key Points

- **CSV is the authoritative source** - All changes should be made in CSV first
- **sync-foods command** ensures database matches CSV exactly
- **--enable-all** ensures all CSV foods are enabled in locale
- **Always dry-run first** to preview changes

## Japanese Food Import Workflow

```bash
# 1. Validate CSV structure and nutrients
pnpm cli validate-nutrients-batch -i food-list-japan.csv -l jp_JP_2024 --skip-header-rows 2

# 2. Preview import (dry run)
pnpm cli import-foods -i food-list-japan.csv -l jp_JP_2024 --preset japan --dry-run

# 3. Actual import
pnpm cli import-foods -i food-list-japan.csv -l jp_JP_2024 --preset japan --skip-invalid-nutrients

# 4. Verify database consistency
pnpm cli verify-consistency -i food-list-japan.csv -l jp_JP_2024 --skip-header-rows 2

# 5. Sync to ensure CSV is source of truth
pnpm cli sync-foods -i food-list-japan.csv -l jp_JP_2024 --enable-all
```

## Common Commands

### Import Commands

```bash
# Generic import with presets
pnpm cli import-foods -i <file> -l <locale> --preset [japan|uk|france|usa|custom]

# Multi-pass import for complex dependencies
pnpm cli import-foods-mp -i <file> -l <locale> --multi-pass true

# Import with custom settings
pnpm cli import-foods -i <file> -l <locale> --skip-header-rows 1 --tags "imported" --batch-size 10
```

### Sync and Validation Commands

```bash
# Sync database with CSV (make CSV source of truth)
pnpm cli sync-foods -i <file> -l <locale> --dry-run --enable-all

# Batch nutrient validation
pnpm cli validate-nutrients-batch -i <file> -l <locale> --report-path validation.json

# Check specific nutrient record
pnpm cli check-nutrients -t AUSNUT -r 02D10267

# Verify CSV-database consistency
pnpm cli verify-consistency -i <file> -l <locale> --report-path consistency.json
```

### Utility Commands

```bash
# Cross-check import results
pnpm cli cross-check-import -c <csv> -r <report> -l <locale> -o analysis.json

# Convert report formats
pnpm cli convert-report -i report.json -f [csv|markdown] -o output.ext

# Rollback failed import
pnpm cli rollback-import -r import-report.json --dry-run
```

## Preset Configurations

| Preset   | Headers Skipped | Tags         | Nutrient Tables         |
| -------- | --------------- | ------------ | ----------------------- |
| `japan`  | 2               | japanese     | AUSNUT, STFCJ, DCDJapan |
| `uk`     | 1               | uk           | NDNS, MCCANCE           |
| `france` | 1               | french       | CIQUAL, ANSES           |
| `usa`    | 1               | usa          | USDA, USDA_SR           |
| `custom` | configurable    | configurable | none                    |

## Common Flags

### Import Flags

- `--dry-run` - Preview without importing
- `--skip-invalid-nutrients` - Skip problematic nutrient mappings
- `--skip-existing` - Skip foods that already exist
- `--skip-associated-foods` - Skip associated foods (for multi-pass import)
- `--delete-action1-local` - Delete local food records for action 1 foods (removes from admin UI)
- `--batch-size <n>` - Process in batches (default: 10)
- `--report-path <file>` - Save detailed import report

### Report Flags

- `--report-format [json|csv|markdown]` - Report output format
- `--skip-header-rows <n>` - Number of CSV header rows to skip

### Validation Flags

- `--check-existing-foods` - Verify foods exist in database
- `--generate-validation-report` - Generate detailed validation analysis
- `--include-valid-rows` - Include successful rows in reports

## File Patterns

### Japanese Food Codes

- International: `ABCD` (4 capital letters)
- Japanese: `jp[letter][4-5 digits][optional letter]`
- Examples: `RICE`, `jpa1234`, `jpb12345a`

### CSV Structure (Japan)

```
Header Row 1: Descriptive headers
Header Row 2: Column descriptions
Data Row 1: Intake24 Code, Action, English Description, Japanese Description, ...
Data Row 2: ...
```

### Action Values

- `1` - Exclude/Delete food
  - Removes from enabled foods list (won't appear in surveys)
  - With `--delete-action1-local`: Also deletes local food record (won't appear in admin tree view)
- `2` - Add new local food (creates food specific to this locale)
- `3` - Include existing global food (adds reference to existing food)
- `4` - Add new global + local food (creates food available across locales)

## Error Recovery

```bash
# If import fails, rollback
pnpm cli rollback-import -r failed-import-report.json

# If nutrients validation fails, check specific records
pnpm cli check-nutrients -t <table> -r <record-id> --dry-run

# If consistency check fails, cross-check for details
pnpm cli cross-check-import -c original.csv -r import-report.json -l <locale>
```

## Performance Tips

- Use `--batch-size 5-20` for large files or slow connections
- Use `import-foods-mp` for files with complex dependencies
- Always run `--dry-run` first for large imports
- Keep batch sizes smaller for files with many nutrient mappings
- Use `--skip-invalid-nutrients` to avoid 500 errors

## Output Files

All commands can generate reports in multiple formats:

- **JSON** - Structured data, best for processing
- **CSV** - Excel-compatible, best for analysis
- **Markdown** - Human-readable, best for documentation

Reports include:

- Import statistics (success/failure counts)
- Detailed error information with row numbers
- Validation results and suggestions
- Performance metrics and timing

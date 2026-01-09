# Japanese Food Import Guide

This guide walks you through the complete workflow for importing Japanese food data into Intake24, from validation to import to verification.

## Overview

The recommended workflow ensures data quality and consistency:

1. **Pre-Import Validation** - Validate CSV structure and data quality
2. **Import Process** - Import validated data using appropriate settings
3. **Post-Import Verification** - Verify database consistency with original CSV

## Prerequisites

- Node.js ≥22.12.0
- Access to Intake24 API (admin token configured)
- Japanese food list CSV file (e.g., `food-list-japan.csv`)

## Workflow Steps

### Step 1: Pre-Import Validation

Validate your CSV file structure and data quality before attempting import:

```bash
# Validate nutrient mappings (critical - prevents 500 errors during import)
pnpm cli validate-nutrients-batch \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --skip-header-rows 2 \
  --report-path nutrient-validation-report.json

# Check specific nutrient records if validation shows issues
pnpm cli check-nutrients \
  -t AUSNUT \
  -r 02D10267 \
  --dry-run
```

**What this validates:**

- CSV structure and column count
- Food code formats (jp_JP patterns)
- Nutrient table mappings (AUSNUT, STFCJ, DCDJapan)
- Required fields presence
- Japanese character validation

### Step 2: Import Process

Once validation passes, proceed with the actual import:

```bash
# Recommended: Start with dry-run to preview changes
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan \
  --dry-run \
  --report-path import-preview.json

# If preview looks good, run actual import
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan \
  --skip-invalid-nutrients \
  --report-path import-report.json \
  --report-format json

# For complex data with dependencies, use multi-pass processing
pnpm cli import-foods-mp \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --multi-pass true \
  --skip-invalid-nutrients \
  --report-path import-multipass-report.json
```

**Japan Preset Configuration:**

- Skips 2 header rows (standard for Japan CSV format)
- Adds `japanese` tag to all imported foods
- Pre-configured nutrient table mappings:
  - AUSNUT → AUSNUT
  - STFCJ → STFCJ
  - DCD for Japan → DCD_Japan

### Step 3: Post-Import Verification

Verify that the import was successful and data consistency:

```bash
# Verify consistency between CSV and database
pnpm cli verify-consistency \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --skip-header-rows 2 \
  --report-path consistency-report.json \
  --report-format json

# Cross-check import results with original CSV
pnpm cli cross-check-import \
  -c food-list-japan.csv \
  -r import-report.json \
  -l jp_JP_2024 \
  --check-existing-foods \
  --generate-validation-report \
  -o cross-check-analysis.json
```

**What verification checks:**

- All foods from CSV exist in database
- Food names match between CSV and database
- Categories are correctly assigned
- Nutrient mappings are properly stored
- No data corruption during import

## Error Recovery

If issues occur during import:

```bash
# Rollback failed import using report file
pnpm cli rollback-import \
  -r import-report.json \
  --dry-run  # Preview rollback actions first

# If satisfied with preview, execute rollback
pnpm cli rollback-import \
  -r import-report.json
```

## Report Analysis

Convert reports to different formats for analysis:

```bash
# Convert JSON report to CSV for Excel analysis
pnpm cli convert-report \
  -i import-report.json \
  -f csv \
  -o import-analysis.csv

# Convert to Markdown for documentation
pnpm cli convert-report \
  -i import-report.json \
  -f markdown \
  -o import-summary.md
```

## Complete Example Workflow

Here's a complete example for importing `food-list-japan.csv`:

```bash
#!/bin/bash

FILE="food-list-japan.csv"
LOCALE="jp_JP_2024"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🇯🇵 Starting Japanese Food Import Workflow"
echo "📁 File: $FILE"
echo "🌐 Locale: $LOCALE"
echo "⏰ Timestamp: $TIMESTAMP"

# Step 1: Pre-import validation
echo "📋 Step 1: Validating nutrient mappings..."
pnpm cli validate-nutrients-batch \
  -i "$FILE" \
  -l "$LOCALE" \
  --skip-header-rows 2 \
  --report-path "nutrient-validation-${TIMESTAMP}.json"

if [ $? -ne 0 ]; then
  echo "❌ Nutrient validation failed. Fix issues before proceeding."
  exit 1
fi

# Step 2: Import with dry-run first
echo "🔍 Step 2: Running import preview..."
pnpm cli import-foods \
  -i "$FILE" \
  -l "$LOCALE" \
  --preset japan \
  --dry-run \
  --report-path "import-preview-${TIMESTAMP}.json"

if [ $? -ne 0 ]; then
  echo "❌ Import preview failed. Check validation issues."
  exit 1
fi

echo "✅ Preview successful. Proceeding with actual import..."

# Step 3: Actual import
# Add --delete-action1-local if you want to completely remove action 1 foods from admin UI
pnpm cli import-foods \
  -i "$FILE" \
  -l "$LOCALE" \
  --preset japan \
  --skip-invalid-nutrients \
  --delete-action1-local \
  --report-path "import-report-${TIMESTAMP}.json"

if [ $? -ne 0 ]; then
  echo "❌ Import failed. Check logs and consider rollback."
  exit 1
fi

# Step 4: Verify consistency
echo "🔍 Step 4: Verifying database consistency..."
pnpm cli verify-consistency \
  -i "$FILE" \
  -l "$LOCALE" \
  --skip-header-rows 2 \
  --report-path "consistency-report-${TIMESTAMP}.json"

# Step 5: Generate analysis reports
echo "📊 Step 5: Generating analysis reports..."
pnpm cli convert-report \
  -i "import-report-${TIMESTAMP}.json" \
  -f csv \
  -o "import-analysis-${TIMESTAMP}.csv"

pnpm cli convert-report \
  -i "import-report-${TIMESTAMP}.json" \
  -f markdown \
  -o "import-summary-${TIMESTAMP}.md"

echo "✅ Japanese food import workflow completed!"
echo "📁 Reports generated with timestamp: $TIMESTAMP"
echo ""
echo "📄 Files created:"
echo "  - nutrient-validation-${TIMESTAMP}.json"
echo "  - import-preview-${TIMESTAMP}.json"
echo "  - import-report-${TIMESTAMP}.json"
echo "  - consistency-report-${TIMESTAMP}.json"
echo "  - import-analysis-${TIMESTAMP}.csv"
echo "  - import-summary-${TIMESTAMP}.md"
```

## Common Issues and Solutions

### Nutrient Validation Failures

**Issue:** 500 errors during import due to invalid nutrient mappings
**Solution:** Always run `validate-nutrients-batch` first and use `--skip-invalid-nutrients` flag

### Japanese Character Issues

**Issue:** Garbled Japanese text in database
**Solution:** Ensure CSV is UTF-8 encoded and database supports Japanese characters

### Large File Performance

**Issue:** Timeouts with large CSV files
**Solution:** Use `import-foods-mp` with smaller batch sizes:

```bash
pnpm cli import-foods-mp \
  -i large-food-list.csv \
  -l jp_JP_2024 \
  --batch-size 5 \
  --multi-pass true
```

### Food Code Format Issues

**Issue:** Invalid Intake24 food codes
**Solution:** Ensure codes follow patterns:

- International: `ABCD` (4 capital letters)
- Japanese: `jp[letter][4-5 digits][optional letter]`

## Handling Action 1 Foods (Exclusions/Deletions)

Action 1 foods are marked for exclusion or deletion in the CSV. The import-foods command handles these in two ways:

### Default Behavior (Without Flag)

```bash
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan
```

**What happens:**
- Action 1 foods are removed from the enabled foods list
- Foods won't appear in surveys for respondents
- Foods still appear in admin UI tree view (with "0 locales" indicator)
- Local food records remain in the database

**Use when:** You want to exclude foods from surveys but keep them in the database for reference or future re-inclusion.

### Complete Deletion (With --delete-action1-local Flag)

```bash
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan \
  --delete-action1-local
```

**What happens:**
- Action 1 foods are removed from the enabled foods list
- Local food records are deleted from the database
- Foods won't appear in surveys
- Foods won't appear in admin UI tree view
- Deletion statistics are included in the import report

**Use when:** You want to completely remove foods from both surveys and admin UI (permanent deletion).

### Example: Managing Food Exclusions

```bash
# Step 1: Preview what will be deleted
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan \
  --dry-run \
  --delete-action1-local

# Step 2: Execute deletion
pnpm cli import-foods \
  -i food-list-japan.csv \
  -l jp_JP_2024 \
  --preset japan \
  --delete-action1-local \
  --report-path deletion-report.json

# Step 3: Review deletion report
pnpm cli convert-report \
  -i deletion-report.json \
  -f markdown \
  -o deletion-summary.md
```

**Deletion Report Includes:**
- Number of local foods deleted
- List of deleted food codes and names
- Foods that were already deleted (404 errors)
- Any deletion failures with error details

## Command Reference

### Core Commands

- `import-foods` - Main import command with preset support
- `import-foods-mp` - Multi-pass import for complex dependencies
- `validate-nutrients-batch` - Pre-import nutrient validation
- `verify-consistency` - Post-import consistency checking

### Utility Commands

- `check-nutrients` - Check specific nutrient records
- `cross-check-import` - Compare import results with original CSV
- `convert-report` - Convert reports between formats
- `rollback-import` - Rollback failed imports

### Report Formats

- `json` - Structured data for programmatic processing
- `csv` - Excel-compatible format for analysis
- `markdown` - Human-readable documentation format

## Best Practices

1. **Always validate first** - Use `validate-nutrients-batch` before import
2. **Start with dry-run** - Preview changes before actual import
3. **Keep reports** - Save all reports with timestamps for audit trail
4. **Verify results** - Run consistency checks after import
5. **Have rollback plan** - Keep import reports for potential rollback
6. **Use appropriate batch sizes** - Smaller batches for large files or unstable connections
7. **Monitor progress** - Large imports show progress indicators
8. **Check logs** - Review CLI output for warnings and suggestions

# CSV as Source of Truth for Japanese Food List

## Overview

The `sync-foods` command ensures that the database reflects the CSV food list exactly, treating the CSV as the authoritative source of truth for food data.

## What the Sync Command Does

### 1. Global Food Management

- **Creates** foods that exist in CSV but not in the database
- **Updates** existing foods to match CSV data exactly:
  - English names (normalizes quote differences)
  - Categories
  - Attributes (readyMealOption, sameAsBeforeOption, etc.)

### 2. Local Food Management

- **Creates** local food entries for the specified locale
- **Updates** local names to match the CSV exactly
- **Syncs** nutrient table mappings from CSV

### 3. Food Enablement

- **Tracks** which foods should be enabled in the locale
- **Updates** the enabled foods list when `--enable-all` flag is used
- **Reports** foods that need to be enabled

## Usage

### Basic Sync (Dry Run)

```bash
pnpm cli sync-foods -i ../../packages/excel-reader/japan-food-list.csv -l jp_JP_2024 --dry-run
```

### Full Sync with Report

```bash
pnpm cli sync-foods \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  -r sync-report.json \
  --enable-all
```

### Force Update All Differences

```bash
pnpm cli sync-foods \
  -i ../../packages/excel-reader/japan-food-list.csv \
  -l jp_JP_2024 \
  --force-update \
  --enable-all
```

## Command Options

- `-i, --input-path`: Path to the CSV food list file (required)
- `-l, --locale-id`: Target locale ID, e.g., jp_JP_2024 (required)
- `--dry-run`: Preview changes without applying them
- `-r, --report-path`: Save detailed sync report to file
- `--skip-header-rows`: Number of header rows to skip (default: 3)
- `--force-update`: Update even minor differences like quote formatting
- `--enable-all`: Enable all CSV foods in the locale

## Sync Logic

### Name Normalization

The sync command handles common formatting differences:

- Removes quotes around Japanese terms in English names
- Normalizes whitespace
- Preserves exact Japanese names from CSV

### Change Detection

Changes are detected for:

- Name differences (English and local)
- Category assignments
- Food attributes
- Nutrient table mappings

### Update Strategy

- **Significant changes**: Always updated (categories, attributes, major name changes)
- **Minor changes**: Only updated with `--force-update` flag (e.g., quote differences around Japanese terms like "meshi" vs meshi)
- **Local names**: Always updated to match CSV exactly
- **Important**: The actual quotes in names are preserved exactly as they appear in the CSV - the quote normalization is only used for change detection

## Example Workflow

1. **Check Current State**

   ```bash
   pnpm cli verify-consistency -i japan-food-list.csv -l jp_JP_2024 -r before-sync.json
   ```

2. **Preview Sync Changes**

   ```bash
   pnpm cli sync-foods -i japan-food-list.csv -l jp_JP_2024 --dry-run
   ```

3. **Apply Sync**

   ```bash
   pnpm cli sync-foods -i japan-food-list.csv -l jp_JP_2024 --enable-all -r sync-report.json
   ```

4. **Verify Results**
   ```bash
   pnpm cli verify-consistency -i japan-food-list.csv -l jp_JP_2024 -r after-sync.json
   ```

## Report Format

The sync report includes:

```json
{
  "metadata": {
    "startedAt": "2025-07-22T14:30:00.000Z",
    "completedAt": "2025-07-22T14:35:00.000Z",
    "inputFile": "japan-food-list.csv",
    "localeId": "jp_JP_2024",
    "dryRun": false
  },
  "summary": {
    "totalProcessed": 4145,
    "created": 5,
    "updated": 1030,
    "enabled": 701,
    "skipped": 0,
    "failed": 0
  },
  "details": {
    "created": [
      {"code": "FL-TURK", "name": "Turkish Bread"}
    ],
    "updated": [
      {"code": "jpf1086", "changes": ["name: quoted version → unquoted version"]}
    ],
    "enabled": [
      {"code": "CALF", "name": "Calf liver"}
    ],
    "failed": []
  }
}
```

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Save sync reports** for audit trail
3. **Verify consistency** after sync to ensure success
4. **Use --force-update sparingly** to avoid unnecessary API calls
5. **Enable foods explicitly** with --enable-all when ready

## Maintaining CSV as Source of Truth

To ensure the CSV remains the authoritative source:

1. **All food changes** should be made in the CSV first
2. **Run sync-foods** after any CSV updates
3. **Never manually edit** foods in the admin interface for synced locales
4. **Use version control** for the CSV file
5. **Document changes** in CSV commit messages

## Troubleshooting

### API Rate Limits

The sync command includes delays between batches to avoid overwhelming the API. If you encounter rate limit errors:

- Reduce batch size in the code
- Add longer delays between operations

### Missing Global Foods

Foods with action "4" that don't exist globally will be created automatically.

### Disabled Foods

Foods that exist but are disabled will be reported. Use `--enable-all` to enable them.

### Name Mismatches

The sync will update both English and Japanese names to match the CSV exactly.

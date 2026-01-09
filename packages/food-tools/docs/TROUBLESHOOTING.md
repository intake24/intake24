# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the food-tools package.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Error Messages](#error-messages)
3. [Validation Failures](#validation-failures)
4. [Import Problems](#import-problems)
5. [API Errors](#api-errors)
6. [Performance Issues](#performance-issues)
7. [Debug Techniques](#debug-techniques)
8. [Getting Help](#getting-help)

## Common Issues

### Issue: Command Not Found

**Symptom**:

```bash
pnpm cli:dev import-foods
Error: Unknown command 'import-foods'
```

**Solutions**:

1. Ensure you're in the correct directory (`apps/cli`)
2. Run `pnpm install` to install dependencies
3. Check that `@intake24/food-tools` is imported in `src/index.ts`
4. Rebuild the CLI: `pnpm build`

### Issue: API Authentication Failed

**Symptom**:

```
Error: API error: 401 Unauthorized
```

**Solutions**:

1. Check your `.env` file has valid credentials:
   ```bash
   API_V4_URL=https://api.intake24.com
   API_V4_ACCESS_TOKEN=your-valid-token-here
   ```
2. Verify token hasn't expired
3. Ensure you have admin permissions
4. Test with: `pnpm cli:dev check-nutrients -t NDNS -r TEST --dry-run`

### Issue: CSV Parsing Errors

**Symptom**:

```
Error: Invalid CSV structure: Expected 17 columns, found 15
```

**Solutions**:

1. Check column count matches expected format
2. Ensure proper CSV encoding (UTF-8)
3. Verify delimiter is comma (,)
4. Check for unclosed quotes
5. Remove any BOM characters at file start

## Error Messages

### "Nutrient table not found"

**Meaning**: The specified nutrient table doesn't exist in the database

**Example**:

```
Error: Nutrient table 'INVALID_TABLE' not found
```

**Fix**:

1. Check available tables:
   ```bash
   # Valid tables: NDNS, AUSNUT, STFCJ, CIQUAL, USDA
   ```
2. Use correct table ID in CSV
3. For Japanese foods, use `STFCJ` as the table ID

### "Duplicate food code"

**Meaning**: The food code already exists in the locale

**Example**:

```
Error: Food code 'APPL' already exists in locale 'en_GB'
```

**Fix**:

1. Use `--skip-existing` flag to skip duplicates
2. Change action to `3` (update) instead of `2` (create)
3. Use a different food code
4. Check if food should be updated instead

### "Invalid portion size method"

**Meaning**: The portion size method doesn't exist

**Example**:

```
Error: Portion size method 'invalid-method' not found
```

**Fix**:

1. Check available methods for your locale
2. Common valid methods:
   - `standard-portion`
   - `as-served`
   - `guide-image`
   - `weight`
   - `drink-scale`
3. Ensure method parameters reference valid sets

### "Category not found"

**Meaning**: Referenced category doesn't exist

**Example**:

```
Error: Category 'INVALID_CAT' not found in locale
```

**Fix**:

1. Use existing category codes
2. Common categories:
   - `FRUIT` - Fruits
   - `VEGS` - Vegetables
   - `MEAT` - Meat and fish
   - `DAIRY` - Dairy products
   - `CERE` - Cereals
3. Create category first if needed

## Validation Failures

### Nutrient Validation Issues

**Problem**: `validate-nutrients-batch` shows many failures

**Debug Steps**:

1. Check specific failing record:

   ```bash
   pnpm cli:dev check-nutrients -t AUSNUT -r 02D10267
   ```

2. Common issues:
   - Wrong table ID format
   - Record doesn't exist
   - Table not loaded in system

3. Solutions:
   - Use `--skip-invalid-nutrients` flag
   - Fix nutrient mappings in CSV
   - Leave nutrient fields empty if unknown

### Structure Validation

**Problem**: CSV structure validation fails

**Check**:

```bash
# Count columns in header
head -1 your-file.csv | tr ',' '\n' | wc -l

# Check for hidden characters
cat -v your-file.csv | head -5

# Verify encoding
file -I your-file.csv
```

**Fix**:

1. Ensure 17 columns (or as expected)
2. Remove hidden characters
3. Convert to UTF-8 if needed:
   ```bash
   iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv
   ```

## Import Problems

### Slow Import Performance

**Symptoms**: Import takes hours for large files

**Solutions**:

1. Reduce batch size:

   ```bash
   pnpm cli:dev import-foods -i large.csv -l en_GB --batch-size 5
   ```

2. Skip validation where safe:

   ```bash
   --skip-invalid-nutrients --skip-existing
   ```

3. Use multi-pass for complex data:
   ```bash
   pnpm cli:dev import-foods-mp -i complex.csv -l en_GB
   ```

### Partial Import Failures

**Problem**: Some foods import, others fail

**Debug**:

1. Check the import report:

   ```bash
   cat import-report.json | jq '.results.failed'
   ```

2. Common failure reasons:
   - Invalid characters in names
   - Missing required fields
   - Invalid boolean values
   - Constraint violations

3. Fix and retry failed items only

### Association Failures

**Problem**: Associated foods not linking properly

**Solutions**:

1. Ensure associated food exists first
2. Use multi-pass import:
   ```bash
   pnpm cli:dev import-foods-mp -i data.csv -l en_GB --multi-pass true
   ```
3. Import in dependency order
4. Skip associations temporarily:
   ```bash
   --skip-associations
   ```

## API Errors

### Rate Limiting (429)

**Symptom**:

```
Error: API rate limit exceeded
```

**Solutions**:

1. Reduce batch size to 5 or less
2. Add delays between operations
3. Run during off-peak hours
4. Contact admin for limit increase

### Server Errors (500)

**Common Causes**:

1. Invalid nutrient table mappings
2. Database constraint violations
3. Server resource issues

**Debug**:

1. Use `--skip-invalid-nutrients`
2. Check server logs if accessible
3. Try single record to isolate issue
4. Report to system administrator

### Network Timeouts

**Solutions**:

1. Check network connectivity
2. Reduce batch size
3. Increase timeout in environment
4. Use VPN if accessing remote API

## Performance Issues

### Memory Issues

**Symptom**: "JavaScript heap out of memory"

**Solutions**:

1. Increase Node.js memory:

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm cli:dev import-foods ...
   ```

2. Process file in chunks
3. Use streaming for large files
4. Split CSV into smaller files

### Slow Validation

**Optimize validation**:

1. Skip unnecessary checks:

   ```bash
   --no-check-categories --no-check-names
   ```

2. Run validation separately:

   ```bash
   # First validate nutrients only
   pnpm cli:dev validate-nutrients-batch ...

   # Then import with skip flag
   pnpm cli:dev import-foods ... --skip-invalid-nutrients
   ```

## Debug Techniques

### Enable Verbose Logging

Set environment variable:

```bash
export LOG_LEVEL=debug
pnpm cli:dev import-foods ...
```

### Test Single Record

Create minimal test file:

```csv
"Code","Action","English","Local","Table","Record","Ready","Same","Amount","Recipe","Assoc","Brands","Synonyms","BrandSrch","Methods","Categories","Flags"
"TEST001","2","Test Food","Test Food","","","false","true","100","1","","","","0","weight","MEAT",""
```

### Check API Connectivity

```bash
# Test API connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.intake24.com/api/admin/locales

# Test specific endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.intake24.com/api/admin/locales/en_GB/foods
```

### Analyze Reports

```bash
# View error details
cat import-report.json | jq '.results.failed[] | {code, error}'

# Count by error type
cat import-report.json | jq '.results.failed[].error' | sort | uniq -c

# Extract failed food codes
cat import-report.json | jq -r '.results.failed[].food.code' > failed-codes.txt
```

## Getting Help

### Before Asking for Help

1. **Check the documentation**:
   - [Getting Started Guide](./GETTING-STARTED.md)
   - [CSV Template Guide](./CSV-TEMPLATE-GUIDE.md)
   - [Architecture Overview](./ARCHITECTURE.md)

2. **Gather information**:
   - Exact error message
   - Command you ran
   - First few lines of your CSV
   - Environment details (Node version, OS)
   - Relevant report files

3. **Try minimal reproduction**:
   - Create smallest CSV that shows issue
   - Test with dry-run first
   - Isolate to single command

### Reporting Issues

Include in your report:

````markdown
## Environment
- Node.js version:
- OS:
- Package version:

## Command
```bash
pnpm cli:dev import-foods ...
````

## Error

```
Exact error message here
```

## CSV Sample

```csv
First 5 lines of your CSV
```

## What I've Tried

- Step 1
- Step 2

````

### Support Channels

1. **GitHub Issues**: For bugs and feature requests
2. **Documentation**: Check docs folder
3. **API Documentation**: Intake24 API docs
4. **Community Forum**: If available

### Emergency Recovery

If you need to recover from a failed import:

```bash
# 1. Find your import report
ls -la *.json | grep import-report

# 2. Attempt rollback
pnpm cli:dev rollback-import -r import-report-TIMESTAMP.json --dry-run

# 3. If rollback looks good, execute
pnpm cli:dev rollback-import -r import-report-TIMESTAMP.json

# 4. Verify state
pnpm cli:dev verify-consistency -i original.csv -l locale_id
```
````

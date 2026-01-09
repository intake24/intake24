# Food Import Templates

This directory contains CSV templates for different locales and use cases.

## Available Templates

### Generic Template

- `food-import-template.csv` - Basic template with examples

### How to Use

1. Copy the template file:

   ```bash
   cp food-import-template.csv my-foods.csv
   ```

2. Edit the CSV file:
   - Replace example data with your foods
   - Adjust column values as needed
   - Add more rows following the pattern

3. Validate before import:

   ```bash
   pnpm cli:dev validate-nutrients-batch -i my-foods.csv -l YOUR_LOCALE
   ```

4. Import the foods:
   ```bash
   pnpm cli:dev import-foods -i my-foods.csv -l YOUR_LOCALE
   ```

## Column Descriptions

See [CSV Template Guide](../docs/CSV-TEMPLATE-GUIDE.md) for detailed column specifications.

## Creating Locale-Specific Templates

To create a template for your locale:

1. Start with the generic template
2. Adjust header names if needed
3. Use appropriate:
   - Food codes for your locale
   - Nutrient table IDs
   - Portion size methods
   - Categories
4. Add example foods typical for your locale

## Tips

- Keep a few example rows to show patterns
- Include comments in a separate row if needed
- Test with small datasets first
- Version control your templates

# CSV Template Guide for Food Imports

This guide provides detailed information about the CSV format used for importing food data into Intake24.

## Table of Contents

1. [CSV Structure Overview](#csv-structure-overview)
2. [Column Specifications](#column-specifications)
3. [Locale-Specific Templates](#locale-specific-templates)
4. [Data Validation Rules](#data-validation-rules)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

## CSV Structure Overview

### Basic Requirements

- **Encoding**: UTF-8 (required for international characters)
- **Delimiter**: Comma (,)
- **Text Qualifier**: Double quotes (") for fields containing commas
- **Line Endings**: Unix (LF) or Windows (CRLF)
- **Header Rows**: Configurable (typically 1-3 rows)

### Standard Column Order

The standard CSV format expects 17 columns in the following order:

| Column # | Field Name                  | Required | Description                 |
| -------- | --------------------------- | -------- | --------------------------- |
| 1        | Intake24 Code               | Yes      | Unique food identifier      |
| 2        | Action                      | Yes      | Import action (1-4)         |
| 3        | English Description         | Yes      | English food name           |
| 4        | Local Description           | Yes      | Localized food name         |
| 5        | Food Composition Table      | No       | Nutrient table ID           |
| 6        | Food Composition Record ID  | No       | Record ID in nutrient table |
| 7        | Ready Meal Option           | Yes      | Boolean (true/false)        |
| 8        | Same As Before Option       | Yes      | Boolean (true/false)        |
| 9        | Reasonable Amount           | No       | Grams (integer)             |
| 10       | Use In Recipes              | Yes      | Recipe usage type (0-3)     |
| 11       | Associated Food             | No       | Related food code           |
| 12       | Brand Names                 | No       | Pipe-separated brands       |
| 13       | Synonyms                    | No       | Alternative names           |
| 14       | Brand Names as Search Terms | No       | Include brands in search    |
| 15       | Portion Size Methods        | Yes      | Estimation methods          |
| 16       | Categories                  | Yes      | Food categories             |
| 17       | Special Flags               | No       | Locale-specific flags       |

## Column Specifications

### 1. Intake24 Code

**Format**: Depends on locale

- International: 4 uppercase letters (e.g., `RICE`, `MILK`)
- Japanese: `jp[a-z][0-9]{4,5}[a-z]?` (e.g., `jpa1234`, `jpb12345a`)
- Custom: Any alphanumeric up to 8 characters

**Examples**:

```
APPL     # International apple
jpa1001  # Japanese food
FR001    # French custom code
```

### 2. Action

**Values**:

- `1` - Delete (remove from locale)
- `2` - Add new food
- `3` - Update existing food
- `4` - Verify/validate only

### 3. English Description

**Format**: Plain text, can include quoted terms

- Max length: 256 characters
- Can include Unicode characters
- Quotes preserved as-is

**Examples**:

```
Apple, raw
Rice, white, cooked
Sushi roll with "nori" seaweed
```

### 4. Local Description

**Format**: Localized name in target language

- Must match locale's language
- Unicode support required
- Cultural adaptations allowed

**Examples**:

```
りんご、生        # Japanese
Pomme, crue      # French
Apfel, roh       # German
```

### 5-6. Nutrient Mapping

**Food Composition Table IDs**:

- `NDNS` - UK National Diet and Nutrition Survey
- `AUSNUT` - Australian Food Composition
- `STFCJ` - Standard Tables (Japan)
- `CIQUAL` - French Food Composition
- `USDA` - US Department of Agriculture

**Record ID Format**: Table-specific

- NDNS: Numeric (e.g., `1234`)
- AUSNUT: Alphanumeric (e.g., `02D10267`)
- STFCJ: Item number (e.g., `01001`)

### 7-8. Boolean Options

**Format**: `true` or `false` (lowercase)

- Ready Meal: Can be a complete meal?
- Same as Before: Show in "same as before" list?

### 9. Reasonable Amount

**Format**: Integer (grams)

- Typical serving size
- Used for validation
- Optional but recommended

### 10. Use In Recipes

**Values**:

- `0` - Regular food only
- `1` - Use anywhere
- `2` - Recipes only
- `3` - Recipes first (salad, sandwich)

### 11. Associated Food

**Format**: Intake24 code of related food

- Used for portion size inheritance
- Must be valid existing code
- Optional field

### 12-13. Search Terms

**Brand Names**: Pipe-separated list

```
Kellogg's|Nestle|Generic
```

**Synonyms**: Alternative names for search

```
chips,crisps,potato chips
```

### 14. Brand Names as Search Terms

**Format**: `0` or `1`

- `0` - Don't include brands in search
- `1` - Include brand names in search index

### 15. Portion Size Methods

**Format**: Method codes separated by semicolons

**Common Methods**:

- `standard-portion` - Pre-defined portions
- `as-served` - Image-based selection
- `guide-image` - Size guide images
- `drink-scale` - Drinkware selection
- `cereal` - Cereal bowl types
- `milk-in-a-hot-drink` - Special milk method
- `pizza` - Pizza slice selection
- `weight` - Direct weight entry

**With Parameters**:

```
standard-portion:STD001;as-served:ASRV001;weight
guide-image:GUIDE001,GUIDE002;weight
```

### 16. Categories

**Format**: Category codes separated by semicolons

- Must match existing category codes
- At least one required
- Order matters (primary first)

**Examples**:

```
FRUIT
DAIRY;MILK
MEAT;BEEF;PROCESSED
```

### 17. Special Flags

**Format**: Locale-specific

- Milk in hot drink (Japan): `0` or `1`
- Revised descriptions: Additional text
- Custom flags per locale

## Locale-Specific Templates

### Japanese Template (jp_JP)

```csv
"Intake24 Code","Action","English Description","Japanese Description","FCT Table","FCT Record ID","Ready Meal","Same as Before","Reasonable Amount","Use in Recipes","Associated Food","Brand Names","Synonyms","Brands as Search","Portion Methods","Categories","Milk in Hot Drink"
"jpa1001","2","Rice, white, cooked","白飯","STFCJ","01088","false","true","150","1","","","gohan,meshi","0","standard-portion:RICE001;weight","CERE;RICE","0"
"jpb2001","2","Miso soup","味噌汁","STFCJ","17001","false","true","200","1","","","misoshiru","0","standard-portion:SOUP001;as-served:BOWL001","SOUP;TRAD","0"
```

### UK Template (en_GB)

```csv
"Food Code","Action","Name","Local Name","Table","Record","Ready","Same Before","Amount","Recipes","Related","Brands","Synonyms","Brand Search","Methods","Categories","Flags"
"APPL","2","Apple, eating, raw","Apple, eating, raw","NDNS","1234","false","true","100","1","","","","0","standard-portion:APPL_STD;weight","FRUIT",""
"BRED","2","Bread, white, sliced","Bread, white, sliced","NDNS","5678","false","true","40","1","","Hovis|Warburtons","","1","standard-portion:BRED_STD;guide-image:BRED_GI","CERE",""
```

### French Template (fr_FR)

```csv
"Code","Action","Nom Anglais","Nom Français","Table Nut","ID Nut","Repas","Même","Quantité","Recettes","Associé","Marques","Synonymes","Rech Marques","Méthodes","Catégories","Drapeaux"
"FR001","2","Apple","Pomme","CIQUAL","1001","false","true","150","1","","","","0","standard-portion:POM_STD;weight","FRUIT",""
"FR002","2","Bread","Pain","CIQUAL","2001","false","true","50","1","","","baguette","0","standard-portion:PAIN_STD;guide-image:PAIN_GI","CERE",""
```

### US Template (en_US)

```csv
"Code","Action","English Name","Local Name","Nutrient Table","Record ID","Ready Meal","Same as Before","Reasonable Amount","Use in Recipes","Associated","Brands","Synonyms","Brand Search","Portion Methods","Categories","Flags"
"US001","2","Apple, raw, with skin","Apple, raw, with skin","USDA","09003","false","true","182","1","","","","0","standard-portion:APPL_US;weight","FRUIT",""
"US002","2","Bread, white, commercially prepared","Bread, white, commercially prepared","USDA","18069","false","true","43","1","","Wonder|Sara Lee","","1","standard-portion:BRD_US;weight","GRAIN",""
```

## Data Validation Rules

### Required Fields

1. **Intake24 Code**: Must be unique within locale
2. **Action**: Must be 1, 2, 3, or 4
3. **English Description**: Cannot be empty
4. **Local Description**: Cannot be empty
5. **Ready Meal Option**: Must be true/false
6. **Same as Before Option**: Must be true/false
7. **Use in Recipes**: Must be 0, 1, 2, or 3
8. **Portion Size Methods**: At least one valid method
9. **Categories**: At least one valid category

### Validation Patterns

#### Food Code Validation

```javascript
// International pattern
/^[A-Z]{4}$/

// Japanese pattern
/^jp[a-z]\d{4,5}[a-z]?$/

// General pattern (8 chars max)
/^[A-Za-z0-9]{1,8}$/
```

#### Nutrient Table Mapping

Valid combinations:

- NDNS + Numeric ID
- AUSNUT + Alphanumeric ID
- STFCJ + Numeric ID
- CIQUAL + Numeric ID
- USDA + Numeric ID

#### Portion Size Methods

Format: `method:parameter1,parameter2;method2:param`

Valid methods must exist in the system:

- Check available methods via API
- Parameters must reference existing sets

## Examples

### Complete Multi-Locale Example

```csv
"Code","Action","English","Local","Table","Record","Ready","Same","Amount","Recipe","Assoc","Brands","Synonyms","BrandSrch","Methods","Categories","Flags"
"INTL001","2","Apple, red","Manzana roja","","","false","true","150","1","","","apple","0","standard-portion:APPL_STD;weight","FRUIT",""
"jpa1001","2","Rice bowl","ご飯茶碗一杯","STFCJ","01088","false","true","150","1","","","gohan","0","standard-portion:RICE_JP;weight","CERE;RICE","0"
"FR001","2","Cheese, camembert","Camembert","CIQUAL","12001","false","true","30","1","","President","fromage","1","standard-portion:CHEM_FR;weight","DAIRY;CHEESE",""
"US001","2","Hamburger","Hamburger","USDA","21001","true","true","200","0","","McDonald's|Burger King","burger","1","standard-portion:BURG_US;weight","MEAT;FAST",""
```

### Handling Special Characters

```csv
"Code","Action","English","Local","Table","Record","Ready","Same","Amount","Recipe","Assoc","Brands","Synonyms","BrandSrch","Methods","Categories","Flags"
"TEST001","2","Bread with \"quotes\"","Pain avec \"guillemets\"","","","false","true","50","1","","Brand's","","0","weight","CERE",""
"TEST002","2","Café, espresso","Café, espresso","","","false","true","30","1","","Nespresso","coffee,expresso","1","drink-scale:ESPR;weight","BEVN",""
"TEST003","2","Fish & chips","Fish & chips","","","true","true","300","0","","","fish and chips","0","standard-portion:FISH_CHIPS;weight","MEAT;FISH",""
```

## Best Practices

### File Preparation

1. **Use UTF-8 encoding** - Essential for international characters
2. **Validate before import** - Use validation commands first
3. **Start small** - Test with a few rows before full import
4. **Keep backups** - Version control your CSV files

### Data Quality

1. **Consistent naming** - Follow naming conventions for your locale
2. **Complete data** - Fill all required fields
3. **Valid references** - Ensure codes and IDs exist
4. **Appropriate methods** - Use suitable portion size methods

### Performance

1. **Batch appropriately** - 10-20 rows for normal imports
2. **Handle dependencies** - Use multi-pass for complex data
3. **Skip invalid nutrients** - Prevent 500 errors
4. **Monitor progress** - Check reports for issues

### Maintenance

1. **CSV as source of truth** - Always update CSV first
2. **Regular syncs** - Keep database aligned with CSV
3. **Document changes** - Track modifications in version control
4. **Test updates** - Verify changes before production

# Malaysian Food List - Data Quality Issues

**File:** `malay-food-list.csv`
**Locale:** `ms_MY_2024`
**Last Updated:** 2026-01-23
**Verified Against:** `br-hidden-block-a7r87shx` (polished-boat-12361338)

---

## Executive Summary

| Issue Type                   | Count | Severity | Status                            |
| ---------------------------- | ----- | -------- | --------------------------------- |
| Name mismatches (code reuse) | 12    | Critical | Needs resolution                  |
| Nutrient table mismatches    | 8     | Critical | Awaiting HPB table import         |
| Missing nutrient mappings    | 1,702 | Info     | Intentional (tables not imported) |
| Category discrepancies       | 7     | Warning  | Classification differences        |
| Portion size mismatches      | 10    | Warning  | Needs review                      |
| Associated foods missing     | 113   | Warning  | Not imported yet                  |
| Attribute mismatches         | 108   | Warning  | Needs sync                        |

**Overall Consistency Score:** 25% (Grade F)

---

## 1. Name Mismatches (Food Code Reuse)

**Impact:** High - Food codes are being reused for completely different foods. Importing will overwrite existing data.

### 1.1 Critical - Completely Different Foods (6)

These food codes exist in the database for different foods. **New codes must be assigned.**

| Code     | CSV Food                  | DB Food                          | Recommendation  |
| -------- | ------------------------- | -------------------------------- | --------------- |
| MY052001 | Kadok leaves, fresh       | Baby kailan w garlic, stir-fried | Assign new code |
| MY065601 | Rambai, fresh             | Yellow raisin                    | Assign new code |
| MY066201 | Star fruit, fresh         | Air asam                         | Assign new code |
| MY102004 | Tuna flakes in chilli oil | Mixed seafood dumpling           | Assign new code |
| MY102005 | Sea cucumber soup         | Tuna flakes in vegetable oil     | Assign new code |
| MY102006 | Tuna in mayonnaise        | Shark fin soup                   | Assign new code |

### 1.2 Minor - Same Food, Different Preparation (2)

| Code     | CSV                      | DB                          | Recommendation           |
| -------- | ------------------------ | --------------------------- | ------------------------ |
| MY053102 | Papaya shoots, **fresh** | Papaya shoots, **boiled**   | Clarify which is correct |
| MY062501 | Jackfruit, **fresh**     | Jackfruit, **freeze dried** | Clarify which is correct |

### 1.3 Cosmetic - Name Extensions/Spelling (4)

| Code     | Issue                                          | Recommendation       |
| -------- | ---------------------------------------------- | -------------------- |
| MY160111 | CSV adds "Coconut paal" prefix to Kerala appam | Can sync - minor     |
| MY160112 | CSV adds "Coconut egg paal" prefix             | Can sync - minor     |
| MY160212 | Local spelling: "Kari puff" vs "Karipap"       | Standardize spelling |
| MY160214 | Local spelling: "Kari puff" vs "Karipap"       | Standardize spelling |

---

## 2. Nutrient Table Mismatches

**Impact:** High - 8 foods are mapped to "Water, tap" (AUSNUT:01B10311) instead of correct nutrient data.

**Root Cause:** CSV references nutrient tables that don't exist in the database.

### 2.1 Missing Nutrient Tables

| CSV Table Name | Exists in DB? | Mapped To                 |
| -------------- | ------------- | ------------------------- |
| Singapore HPB  | No            | -                         |
| HPB            | No            | -                         |
| MyFCDCombined  | No            | Malaysia_FCD (via preset) |
| AUSNUT         | Yes           | AUSNUT                    |
| Malaysia_FCD   | Yes           | Malaysia_FCD              |

### 2.2 Affected Foods

| Code     | Food                     | Expected Table | Expected Record |
| -------- | ------------------------ | -------------- | --------------- |
| MY011440 | Chicken rice (rice only) | Singapore HPB  | SIN00000734     |
| MY101808 | Mussel {hotpot}          | MyFCDCombined  | 401060          |
| MY160107 | Chwee kueh               | Singapore HPB  | SIN00000879     |
| MY160201 | Apam balik, thin         | MyFCDCombined  | 212015          |
| MY160202 | Apam balik, thick        | Singapore HPB  | SIN00002427     |
| MY160247 | Pineapple tart           | MyFCDCombined  | 212022          |
| MY160501 | Kuih bangkit             | MyFCDCombined  | 213009          |
| MY160506 | Yam cake/taro cake       | Singapore HPB  | SIN00003661     |

**Resolution:** Import HPB nutrient table, then re-run nutrient mapping sync.

---

## 3. Category Discrepancies

### 3.1 Missing Categories (7 foods)

| Code     | Food              | CSV Category       | DB Category | Issue                        |
| -------- | ----------------- | ------------------ | ----------- | ---------------------------- |
| LYCE     | Lychees           | FREF (Fresh fruit) | TROP        | Classification difference    |
| MOZZ     | Mozzarella cheese | CHES               | SFTC        | Classification difference    |
| PANE     | Paneer            | CHES               | HRDC        | Classification difference    |
| MY052001 | Kadok leaves      | HRSP               | VTGB, BRCL  | Also has name mismatch       |
| MY055214 | Chai kueh         | VTGB               | VGDI        | Classification difference    |
| MY066201 | Star fruit        | FRTS               | PCKL        | DB category seems incorrect  |
| MY140503 | Kuah campur       | SLW3               | COND        | **SLW3 doesn't exist in DB** |

### 3.2 Category Existence Check

| Category | Exists | ms_MY_2024 Name        |
| -------- | ------ | ---------------------- |
| FREF     | Yes    | Buah segar             |
| CHES     | Yes    | Sandwic dan roll       |
| HRSP     | Yes    | Herba dan rempah ratus |
| VTGB     | Yes    | Sayur-sayuran          |
| FRTS     | Yes    | Buah-buahan            |
| SLW3     | **No** | -                      |

**Note:** Only SLW1 and SLW2 exist. SLW3 must be created or CSV updated.

---

## 4. Portion Size Mismatches (10 foods)

### 4.1 Related to Name Mismatches (6 foods)

These portion size issues are caused by code reuse - the CSV and DB are for different foods.

| Code     | CSV Food                  | Issue                                            |
| -------- | ------------------------- | ------------------------------------------------ |
| MY052001 | Kadok leaves              | CSV: standard-portion, DB: as-served             |
| MY065601 | Rambai                    | CSV: standard-portion, DB: as-served/guide-image |
| MY066201 | Star fruit                | CSV: standard-portion, DB: guide-image/as-served |
| MY102004 | Tuna flakes in chilli oil | CSV: guide-image/as-served, DB: standard-portion |
| MY102005 | Sea cucumber soup         | CSV: as-served, DB: guide-image/as-served        |
| MY102006 | Tuna in mayonnaise        | CSV: guide-image/as-served, DB: as-served        |

### 4.2 CSV Parsing Issues (2 foods)

These have malformed portion size data in the CSV (method strings embedded in parameters).

| Code     | Food                          | Issue                                           |
| -------- | ----------------------------- | ----------------------------------------------- |
| MY011556 | Rice porridge/congee, chicken | Parameters contain "Method: guide-image" string |
| MY110401 | Buffalo milk                  | Parameters contain "false Method:" strings      |

**Example of malformed data:**

```
serving-image-set: "MY_rice_porridge_m7fqun Method: guide-image"
```

### 4.3 Genuine Method Differences (2 foods)

| Code     | Food                | CSV Method       | DB Method                    |
| -------- | ------------------- | ---------------- | ---------------------------- |
| MY020410 | Jacket potato       | as-served        | as-served (x2)               |
| MY120302 | Japanese mayonnaise | guide-image (x3) | guide-image (x3) + as-served |

---

## 5. Associated Foods (113 total)

### 5.1 Missing Associations (108 foods)

CSV has associated food prompts that are not in the database. Associated foods trigger follow-up questions like "Did you have X with your Y?" during dietary recall.

**Impact:** Without these associations, users won't be prompted for common accompaniments (sauces, sides, toppings), leading to incomplete dietary data capture.

**Example 1 - Food-to-Category associations:**

| Code | Food               | Type          | Prompt Text                                                |
| ---- | ------------------ | ------------- | ---------------------------------------------------------- |
| CHAP | Chapati, wholemeal | food→category | "Did you have **curry sauce** with your chapati?"          |
|      |                    | food→food     | "Did you have **Bombay potatoes/aloo** with your chapati?" |

**Example 2 - Multiple condiment prompts:**

| Code | Food          | CSV Raw Data                                                                                    |
| ---- | ------------- | ----------------------------------------------------------------------------------------------- |
| DUCK | Duck, roasted | `COND({en: Did you have any condiments with your Duck? (eg. chilli sauce, soy sauce, garlic)})` |
|      |               | `MEAT({en: Did you have any side dishes with your Duck? (eg. egg, tofu, vegetables)})`          |

**Example 3 - Toppings for dairy:**

| Code | Food                     | Associations               |
| ---- | ------------------------ | -------------------------- |
| LFNP | Natural yoghurt, low fat | CBAR: Chocolate bars       |
|      |                          | CONF: Confectionery/sweets |
|      |                          | FRTS: Fruits               |
|      |                          | NUTS: Nuts                 |

**Example 4 - Category-based association:**

| Code | Food   | Type     | Target                                                             |
| ---- | ------ | -------- | ------------------------------------------------------------------ |
| PANE | Paneer | category | CARB: "Did you have pasta/rice/noodles/couscous with your paneer?" |

**Example 5 - Sauce prompts for dim sum:**

| Code | Food                  | Associations       |
| ---- | --------------------- | ------------------ |
| F104 | Meat Dim Sim, fried   | CHIS: Chilli sauce |
|      |                       | BBFS: Brown sauce  |
| F106 | Meat Dim Sim, steamed | CHIS: Chilli sauce |
|      |                       | BBFS: Brown sauce  |

**Full list:** 108 foods need associated food prompts imported from CSV.

### 5.2 Partial Matches (5 foods)

CSV has multiple associations, but DB only has some of them.

| Code     | Food                   | CSV Count | DB Count | Missing             |
| -------- | ---------------------- | --------- | -------- | ------------------- |
| SPCK     | Mixed breakfast cereal | 2         | 1        | Sugar/jams category |
| MY110208 | Palak paneer           | 2         | 1        | Chapathi/Naan bread |
| MY110209 | Paneer butter masala   | 2         | 1        | Chapathi/Naan bread |

---

## 6. Attribute Mismatches (108 foods)

**What are food attributes?** These control survey behavior for each food:

| Attribute            | Purpose                                                               | Values                |
| -------------------- | --------------------------------------------------------------------- | --------------------- |
| `readyMealOption`    | Show "Was this a ready meal?" prompt                                  | `true`/`false`/`null` |
| `sameAsBeforeOption` | Allow "Same as before" quick selection                                | `true`/`false`/`null` |
| `reasonableAmount`   | Max reasonable portion in grams                                       | integer or `null`     |
| `useInRecipes`       | Recipe usage: 0=RegularFood, 1=AsIngredientOnly, 2=AsIngredientOrMeal | integer or `null`     |

**Criticality:** Low-Medium. `null` in DB typically means "inherit from parent category", so behavior may be correct even if values differ. However, explicit `false` in CSV provides clearer intent.

### 6.1 Summary by Attribute

| Attribute          | Mismatches | CSV Value | DB Value | Impact                              |
| ------------------ | ---------- | --------- | -------- | ----------------------------------- |
| readyMealOption    | 96         | `false`   | `null`   | Prompt may still appear (inherited) |
| sameAsBeforeOption | 96         | `false`   | `null`   | Feature may still show (inherited)  |
| reasonableAmount   | 12         | `null`    | `0`      | No portion limit enforced           |
| useInRecipes       | 13         | `null`    | `0`      | Treated as regular food             |

### 6.2 Ready Meal & Same As Before Issues (96 foods)

These foods have explicit `false` in CSV but `null` (inherit) in DB.

**Example detail:**

| Code     | Food                            | readyMealOption          | sameAsBeforeOption       |
| -------- | ------------------------------- | ------------------------ | ------------------------ |
| MY010350 | Sandwich bread, hailam/kopitiam | CSV: `false`, DB: `null` | CSV: `false`, DB: `null` |
| MY010412 | Cream filled cake (Twiggies)    | CSV: `false`, DB: `null` | CSV: `false`, DB: `null` |
| MY055214 | Chai kueh                       | CSV: `false`, DB: `null` | CSV: `false`, DB: `null` |
| MY055221 | Japanese cucumber, fresh        | CSV: `false`, DB: `null` | CSV: `false`, DB: `null` |
| MY101808 | Mussel {hotpot}                 | CSV: `false`, DB: `null` | CSV: `false`, DB: `null` |

**Why this matters:** If the parent category has `readyMealOption=true`, these foods will show the prompt even though the CSV explicitly disables it.

### 6.3 Reasonable Amount & Use In Recipes Issues (12-13 foods)

These are primarily **Malaysian noodle dishes** and **Chinese-style prepared foods**.

**Example detail:**

| Code     | Food                           | reasonableAmount     | useInRecipes         |
| -------- | ------------------------------ | -------------------- | -------------------- |
| MY010911 | Char kuey teow, chicken egg    | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY010920 | Chilli pan mee                 | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY010970 | Pork noodle (soup)             | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY010972 | Prawn mee/penang hokkien mee   | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY010983 | Wonton mee (dry)               | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY011574 | Zong zi/rice dumpling, savoury | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY011705 | Dai pau/big pau                | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY053701 | Stir fried radish cake         | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY053704 | Deep fried radish cake         | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY081007 | Chinese dried meat/bakkwa      | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY081008 | Chinese sausage/lap cheong     | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY081012 | Five spiced pork roll/lor bak  | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |
| MY160731 | Mysore pak                     | CSV: `null`, DB: `0` | CSV: `null`, DB: `0` |

**Interpretation:** DB has `0` which means "no reasonable limit" and "regular food (not recipe-only)". CSV having `null` is ambiguous - the team should clarify if these foods should have limits or be recipe ingredients.

---

## 7. Fixed Issues

### 7.1 VGTB Typo (Fixed 2026-01-23)

- **Issue:** 14 foods had `VGTB` instead of `VTGB` in Categories column
- **Resolution:** Replaced all occurrences of `VGTB` with `VTGB`
- **Status:** Complete

---

## 8. Action Items

### High Priority

- [ ] **Assign new food codes** for 6 conflicting foods:
  - MY052001, MY065601, MY066201, MY102004, MY102005, MY102006
- [ ] **Fix CSV parsing issues** in portion size data:
  - MY011556 (Rice porridge)
  - MY110401 (Buffalo milk)
- [ ] **Import HPB nutrient table** to resolve 8 nutrient mismatches

### Medium Priority

- [ ] **Decide on preparation variants** (fresh vs boiled/freeze-dried):
  - MY053102 (Papaya shoots)
  - MY062501 (Jackfruit)
- [ ] **Create SLW3 category** or update CSV for Kuah campur (MY140503)
- [ ] **Standardize spelling** for curry puffs: "Kari puff" vs "Karipap"

### Lower Priority

- [ ] **Import associated food prompts** (108 foods)
- [ ] **Sync attribute values** (108 foods with readyMeal/sameAsBefore differences)
- [ ] **Review category classifications** for 6 foods (LYCE, MOZZ, PANE, etc.)

---

## Appendix: Verification Commands

```bash
# Re-run consistency check with Malaysia preset
pnpm cli verify-consistency \
  -i reports/malaysia/malay-food-list.csv \
  -l ms_MY_2024 \
  --preset malaysia \
  -r reports/malaysia/verify.json

# View specific discrepancy types
cat reports/malaysia/verify.json | jq '.summary'
cat reports/malaysia/verify.json | jq '.discrepancies.names'
cat reports/malaysia/verify.json | jq '[.discrepancies.nutrients[] | select(.issue == "table_mismatch")]'
cat reports/malaysia/verify.json | jq '.discrepancies.portionSizes'
cat reports/malaysia/verify.json | jq '.discrepancies.associatedFoods | length'
cat reports/malaysia/verify.json | jq '.discrepancies.attributes | length'

# Check category existence
# Run via Neon MCP on br-hidden-block-a7r87shx
SELECT code, name FROM category_locals WHERE locale_id = 'ms_MY_2024' AND code IN ('FREF', 'CHES', 'HRSP', 'VTGB', 'FRTS', 'SLW3');
```

---

_Report generated by verify-consistency command and manual analysis._

# Test Interactions for Dynamic Risk Rating

Use these test cases to verify the dynamic risk rating system is working properly.

## How Dynamic Risk Rating is Calculated

The rating (0-10 scale) is based on:
- **Severity** (0-4 points): High=4, Medium=2.5, Low=1
- **Confidence** (0-2 points): Based on confidence percentage
- **Side Effects** (0-2 points): More effects = higher score
- **Mechanism Complexity** (0-1.5 points): Longer mechanism = higher score
- **Recommendation** (0-0.5 points): "Avoid" recommendation adds 0.5

---

## Test Case 1: HIGH RISK Interaction (Expected: ~8.5-9.5)

```json
{
  "drugA": "Warfarin",
  "drugB": "Aspirin",
  "severity": "high",
  "note": "Both drugs thin the blood, increasing bleeding risk significantly",
  "mechanism": "Warfarin inhibits vitamin K-dependent clotting factors while aspirin inhibits platelet aggregation. Combined, they reduce clotting ability dramatically",
  "sideEffects": [
    "Severe bleeding",
    "Internal hemorrhage",
    "Gastrointestinal bleeding",
    "Nosebleeds",
    "Bruising"
  ],
  "confidence": 95,
  "recommendation": "AVOID combination - consult doctor before using together",
  "timeGap": "Do not take together",
  "alternatives": ["Acetaminophen", "Ibuprofen (short-term only)"]
}
```

**Expected Dynamic Rating: ~9.2**

---

## Test Case 2: MODERATE/MEDIUM RISK (Expected: ~4.5-6.5)

```json
{
  "drugA": "Metformin",
  "drugB": "Contrast Dye",
  "severity": "medium",
  "note": "Metformin combined with contrast dye may harm kidneys",
  "mechanism": "Contrast dye can impair kidney function, and metformin accumulation in tissues can cause lactic acidosis if kidneys are compromised",
  "sideEffects": [
    "Kidney damage",
    "Lactic acidosis",
    "Nausea"
  ],
  "confidence": 75,
  "recommendation": "Monitor kidney function closely during use",
  "timeGap": "Space by 48 hours if possible",
  "alternatives": ["SGLT2 inhibitors", "DPP-4 inhibitors"]
}
```

**Expected Dynamic Rating: ~5.4**

---

## Test Case 3: LOW RISK (Expected: ~1.5-3.5)

```json
{
  "drugA": "Vitamin C",
  "drugB": "Calcium Supplements",
  "severity": "low",
  "note": "Both are generally safe together, minimal interaction",
  "mechanism": "Vitamin C may slightly enhance calcium absorption in the intestines",
  "sideEffects": [
    "Mild stomach upset"
  ],
  "confidence": 45,
  "recommendation": "Generally safe, but monitor for stomach discomfort",
  "timeGap": "Can take together with food",
  "alternatives": []
}
```

**Expected Dynamic Rating: ~2.1**

---

## Test Case 4: HIGH SEVERITY BUT LOW EVIDENCE (Expected: ~5.5-6.5)

```json
{
  "drugA": "Lisinopril",
  "drugB": "NSAID",
  "severity": "high",
  "note": "NSAIDs reduce effectiveness of ACE inhibitors and increase kidney damage risk",
  "mechanism": "NSAIDs inhibit prostaglandins that help maintain renal perfusion, reducing drug efficacy and increasing renal dysfunction risk",
  "sideEffects": [
    "Increased blood pressure",
    "Kidney damage",
    "Hyperkalemia"
  ],
  "confidence": 60,
  "recommendation": "Use alternative pain relief if possible",
  "timeGap": "4 hours apart minimum",
  "alternatives": ["Acetaminophen", "Celecoxib"]
}
```

**Expected Dynamic Rating: ~6.2**

---

## Test Case 5: MANY SIDE EFFECTS (Expected: ~7.5-8.5)

```json
{
  "drugA": "Citalopram",
  "drugB": "Tramadol",
  "severity": "high",
  "note": "Serotonin syndrome risk - both increase serotonin levels",
  "mechanism": "Both drugs increase serotonin availability in the central nervous system, potentially leading to serotonin syndrome with symptoms ranging from mild to life-threatening",
  "sideEffects": [
    "Serotonin syndrome",
    "Tremors",
    "Muscle rigidity",
    "Fever",
    "Agitation",
    "Confusion",
    "Rapid heart rate",
    "Sweating"
  ],
  "confidence": 88,
  "recommendation": "AVOID - use safer pain management alternatives",
  "timeGap": "Do not combine",
  "alternatives": ["Acetaminophen", "Physical therapy"]
}
```

**Expected Dynamic Rating: ~8.3**

---

## Test Case 6: NO MECHANISM (Expected: ~3.5-4.5)

```json
{
  "drugA": "Levothyroxine",
  "drugB": "Antacid",
  "severity": "medium",
  "note": "Antacids may reduce levothyroxine absorption",
  "sideEffects": [
    "Reduced thyroid medication effectiveness",
    "Hypothyroid symptoms"
  ],
  "confidence": 70,
  "recommendation": "Separate doses by 4-6 hours",
  "timeGap": "4-6 hours apart",
  "alternatives": []
}
```

**Expected Dynamic Rating: ~4.2**

---

## How to Use These Test Cases

1. **Copy the JSON** for a test case
2. **Open the Drug Interaction page**
3. **Select the two drugs** (you may need to add them to the drug database first)
4. **Click "Check Interaction"**
5. **Verify the Dynamic Risk Score** matches the expected range

## Expected Behavior

- ✅ Ratings should NOW vary between 1-10 (not stuck at 6.1)
- ✅ High severity + high confidence + many effects = Higher score
- ✅ Low severity + low confidence + few effects = Lower score
- ✅ Overall risk calculation should reflect weighted average of all interactions

## Notes

- If you always see 6.1, the API is still returning static values
- The dynamic calculation happens on the **frontend** so it will work regardless of API value
- You can test by manually adding these to your database or modifying API responses

# Scoring Model Documentation

This document explains how the Metadata Quality Platform calculates quality scores.

## Scoring Philosophy

The scoring model is designed around three core principles:

1. **Explainability** - Every score can be traced back to specific rules
2. **Determinism** - Same input always produces same output
3. **Actionability** - Scores guide users toward concrete improvements

## Score Calculation

### Overall Score (0-100)

The overall quality score is calculated as a **weighted percentage** of all rules passed:

```
Overall Score = (Σ passed_rule_weights / Σ total_weights) × 100
```

**Example:**
- Total weight across all rules: 200
- Weights of passed rules: 160
- Overall score: (160/200) × 100 = 80

### Category Scores

Each category has its own score calculated independently:

```
Category Score = (Σ passed_weights_in_category / Σ total_weights_in_category) × 100
```

Categories:
- **Identification** - Title, authors, publisher, version, DOI
- **Description** - Description text, methodology, keywords, data formats
- **Legal** - License, contact information
- **Provenance** - Publication date, temporal/spatial coverage, funding, access URL

## Weight Distribution

### By Category

| Category | Approximate Weight | Rationale |
|----------|-------------------|-----------|
| Identification | ~53 | Core identity is essential |
| Description | ~45 | Usability depends on clarity |
| Legal | ~35 | Legal clarity enables reuse |
| Provenance | ~38 | Context enables assessment |

### By Severity

Rules are weighted based on their importance:

| Severity | Typical Weight Range | Priority Multiplier |
|----------|---------------------|---------------------|
| Critical | 12-15 | ×4 (for recommendations) |
| Important | 8-10 | ×3 |
| Warning | 4-8 | ×2 |
| Suggestion | 2-5 | ×1 |

### Individual Rule Weights

```
Identification Rules:
  title-presence          15  (critical)
  title-length            8   (warning)
  title-not-generic       5   (warning)
  authors-presence        10  (important)
  publisher-presence      6   (warning)
  version-present         4   (suggestion)
  doi-present             5   (suggestion)

Description Rules:
  description-presence    12  (critical)
  description-length-min  10  (important)
  description-detailed    6   (suggestion)
  methodology-present     8   (important)
  methodology-detailed    4   (suggestion)
  data-format-specified   5   (warning)

Keyword Rules:
  keywords-presence       8   (important)
  keywords-minimum-count  6   (warning)
  keywords-not-excessive  2   (suggestion)
  keywords-unique         3   (warning)
  keywords-length         3   (suggestion)
  keywords-no-generic     3   (suggestion)

License Rules:
  license-presence        15  (critical)
  license-spdx-valid      8   (important)
  license-open            5   (suggestion)
  license-not-restrictive 3   (suggestion)
  contact-for-licensing   4   (suggestion)

Provenance Rules:
  publication-date-present    8   (important)
  publication-date-valid      5   (warning)
  publication-date-not-future 4   (warning)
  temporal-coverage-present   5   (suggestion)
  spatial-coverage-present    4   (suggestion)
  funding-present             4   (suggestion)
  access-url-present          6   (warning)
  access-url-valid            3   (warning)
  citations-present           3   (suggestion)
```

## Grade System

| Grade | Score Range | Label | Interpretation |
|-------|-------------|-------|----------------|
| A | 90-100 | Excellent | Meets or exceeds all standards |
| B | 80-89 | Good | Minor improvements recommended |
| C | 70-79 | Acceptable | Could benefit from improvements |
| D | 60-69 | Needs Improvement | Does not meet recommended standards |
| F | 0-59 | Poor | Requires significant improvements |

### Compliance Levels

For automated workflows:

| Score | Compliance Level |
|-------|-----------------|
| ≥90 | Full compliance |
| 70-89 | Partial compliance |
| 50-69 | Minimal compliance |
| <50 | Non-compliant |

## Recommendation Priority

Failed rules are prioritized for recommendations using:

```
Priority Score = Rule Weight × Severity Multiplier
```

Where severity multipliers are:
- Critical: 4
- Important: 3
- Warning: 2
- Suggestion: 1

**Example:**
- `license-presence` (weight 15, critical): 15 × 4 = 60
- `keywords-presence` (weight 8, important): 8 × 3 = 24
- `version-present` (weight 4, suggestion): 4 × 1 = 4

This ensures critical issues appear first in recommendations.

## Score Interpretation Examples

### Score 95 (Grade A)
All critical rules pass. May have minor suggestions like adding DOI or citations.

### Score 75 (Grade C)
Core elements present but quality improvements needed:
- Description may be too short
- Keywords may be insufficient
- Methodology may be missing

### Score 45 (Grade F)
Multiple critical issues:
- Missing or generic title
- No description
- No license
- Few or no keywords

## Category Analysis

### Low Identification Score
**Symptoms:** Missing authors, generic title, no version
**Impact:** Cannot be properly cited or tracked
**Fix:** Add complete attribution information

### Low Description Score
**Symptoms:** Brief description, missing methodology, few keywords
**Impact:** Poor discoverability and usability
**Fix:** Expand documentation and add keywords

### Low Legal Score
**Symptoms:** No license or non-standard license
**Impact:** Users cannot legally reuse the data
**Fix:** Add standard SPDX license identifier

### Low Provenance Score
**Symptoms:** No dates, no access URL, no funding info
**Impact:** Cannot assess data currency or origin
**Fix:** Add temporal and access information

## Customizing Weights

To adjust weights for your organization:

1. Edit rule files in `backend/src/rules/`
2. Modify the `weight` property of specific rules
3. Restart the server

**Guidelines for custom weights:**
- Critical rules: 12-15
- Important rules: 8-12
- Warning rules: 4-8
- Suggestion rules: 1-5
- Total weights should balance across categories

## Integration with CI/CD

For automated pipelines, use the `ci_summary` field:

```json
{
  "ci_summary": {
    "passed": true,           // true if score ≥ 60
    "minimum_score_threshold": 60,
    "blocking_issues": 0,     // critical failures
    "warnings": 3             // non-critical issues
  }
}
```

Exit codes from CLI:
- `0` - Score ≥ 60 (passed)
- `1` - Score < 60 (failed)

## References

- [FAIR Principles](https://www.go-fair.org/fair-principles/)
- [Dublin Core Metadata](https://www.dublincore.org/)
- [DataCite Metadata Schema](https://schema.datacite.org/)
- [SPDX License List](https://spdx.org/licenses/)

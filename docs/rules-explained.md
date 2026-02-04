# Quality Rules Documentation

This document explains all quality rules implemented in the Metadata Quality Platform, organized by category.

## Rule Categories

The platform evaluates metadata across four categories:

| Category | Description | Weight Focus |
|----------|-------------|--------------|
| **Identification** | Core dataset identity and attribution | High |
| **Description** | Content description and discoverability | Medium-High |
| **Legal** | Licensing and legal compliance | High |
| **Provenance** | Data origin, temporal validity, access | Medium |

---

## Identification Rules

Rules for evaluating dataset title, authors, and core identification fields.

### title-presence
**Severity:** Critical | **Weight:** 15

Checks that the dataset has a title. Every dataset must have a title to be identifiable.

```
✓ Pass: Title is present
✗ Fail: Dataset is missing a title
```

### title-length
**Severity:** Warning | **Weight:** 8

Titles should be at least 10 characters to be descriptive enough.

```
✓ Pass: "Climate Data for European Cities (2020-2023)"
✗ Fail: "Data 2023" (too short)
```

### title-not-generic
**Severity:** Warning | **Weight:** 5

Titles should not be overly generic or placeholder text.

```
✓ Pass: "Monthly Precipitation Records for Pacific Northwest"
✗ Fail: "Dataset", "Untitled", "Test Data"
```

### authors-presence
**Severity:** Important | **Weight:** 10

At least one author should be listed for proper attribution.

```
✓ Pass: Authors array contains at least one entry
✗ Fail: Empty authors array or missing field
```

### publisher-presence
**Severity:** Warning | **Weight:** 6

Dataset should identify the publishing organization.

```
✓ Pass: Publisher name is provided
✗ Fail: No publisher information
```

### version-present
**Severity:** Suggestion | **Weight:** 4

Datasets should have version identifiers for reproducibility.

```
✓ Pass: "v2.1.0", "2024-Q1", "4.0"
✗ Fail: No version specified
```

### doi-present
**Severity:** Suggestion | **Weight:** 5

Digital Object Identifier enables persistent citation.

```
✓ Pass: "10.5281/zenodo.1234567"
✗ Fail: No DOI or invalid format
```

---

## Description Rules

Rules for evaluating dataset description quality and richness.

### description-presence
**Severity:** Critical | **Weight:** 12

Dataset must have a description explaining its content.

```
✓ Pass: Description field is present and non-empty
✗ Fail: Missing description
```

### description-length-minimum
**Severity:** Important | **Weight:** 10

Description should be at least 100 characters.

```
✓ Pass: ≥100 characters
✗ Fail: <100 characters
```

### description-comprehensive
**Severity:** Suggestion | **Weight:** 6

Excellent descriptions are 250+ characters.

```
✓ Pass: ≥250 characters with methodology and scope
✗ Fail: <250 characters
```

### methodology-present
**Severity:** Important | **Weight:** 8

Data collection/processing methodology should be documented.

```
✓ Pass: Methodology field explains data collection
✗ Fail: No methodology provided
```

### methodology-detailed
**Severity:** Suggestion | **Weight:** 4

Methodology should be sufficiently detailed (≥50 characters).

```
✓ Pass: Explains instruments, sampling, processing
✗ Fail: Too brief or vague
```

### data-format-specified
**Severity:** Warning | **Weight:** 5

Available data formats should be listed.

```
✓ Pass: ["CSV", "JSON", "NetCDF"]
✗ Fail: No formats specified
```

---

## Keyword Rules

Rules for discoverability through keywords/tags.

### keywords-presence
**Severity:** Important | **Weight:** 8

Keywords must be provided for discoverability.

```
✓ Pass: Keywords array is non-empty
✗ Fail: No keywords
```

### keywords-minimum-count
**Severity:** Warning | **Weight:** 6

At least 3 keywords recommended for adequate coverage.

```
✓ Pass: ≥3 keywords
✗ Fail: <3 keywords
```

### keywords-not-excessive
**Severity:** Suggestion | **Weight:** 2

More than 15 keywords may indicate tag spam.

```
✓ Pass: ≤15 keywords
✗ Fail: >15 keywords
```

### keywords-unique
**Severity:** Warning | **Weight:** 3

Keywords should not contain duplicates.

```
✓ Pass: All keywords are unique
✗ Fail: Duplicate keywords found
```

### keywords-length
**Severity:** Suggestion | **Weight:** 3

Keywords should be meaningful (≥3 characters).

```
✓ Pass: All keywords ≥3 characters
✗ Fail: Very short keywords like "US", "CO"
```

### keywords-no-generic
**Severity:** Suggestion | **Weight:** 3

Avoid overly generic keywords.

```
✓ Pass: Specific domain terms
✗ Fail: "data", "dataset", "information"
```

---

## License Rules

Rules for legal and licensing compliance.

### license-presence
**Severity:** Critical | **Weight:** 15

A license must be specified for legal clarity.

```
✓ Pass: License field is present
✗ Fail: No license specified
```

### license-spdx-valid
**Severity:** Important | **Weight:** 8

License should use standard SPDX identifier.

```
✓ Pass: "CC-BY-4.0", "MIT", "Apache-2.0"
✗ Fail: "Custom", "See website", non-standard
```

### license-open
**Severity:** Suggestion | **Weight:** 5

Open licenses maximize reuse and impact.

```
✓ Pass: CC0, CC-BY, ODbL, MIT
✗ Fail: Restrictive licenses
```

### license-not-restrictive
**Severity:** Suggestion | **Weight:** 3

NoDerivatives (ND) restriction limits usability.

```
✓ Pass: Allows derivative works
✗ Fail: Contains -ND restriction
```

### contact-for-licensing
**Severity:** Suggestion | **Weight:** 4

Contact email for licensing questions.

```
✓ Pass: Valid contact email provided
✗ Fail: No contact information
```

---

## Provenance Rules

Rules for data origin, temporal validity, and access.

### publication-date-present
**Severity:** Important | **Weight:** 8

Publication date establishes data currency.

```
✓ Pass: Date is provided
✗ Fail: No publication date
```

### publication-date-valid
**Severity:** Warning | **Weight:** 5

Date format must be valid.

```
✓ Pass: "2024-01-15" (ISO format)
✗ Fail: "January 2024", invalid format
```

### publication-date-not-future
**Severity:** Warning | **Weight:** 4

Publication date should not be in the future.

```
✓ Pass: Date ≤ today
✗ Fail: Future date
```

### temporal-coverage-present
**Severity:** Suggestion | **Weight:** 5

Time period covered by the data.

```
✓ Pass: start_date and/or end_date provided
✗ Fail: No temporal coverage
```

### spatial-coverage-present
**Severity:** Suggestion | **Weight:** 4

Geographic coverage information.

```
✓ Pass: Geographic description provided
✗ Fail: No spatial information
```

### funding-present
**Severity:** Suggestion | **Weight:** 4

Funding acknowledgment for transparency.

```
✓ Pass: Funding source listed
✗ Fail: No funding information
```

### access-url-present
**Severity:** Warning | **Weight:** 6

URL where data can be accessed.

```
✓ Pass: Access URL provided
✗ Fail: No access URL
```

### access-url-valid
**Severity:** Warning | **Weight:** 3

URL format should be valid HTTP/HTTPS.

```
✓ Pass: Valid URL format
✗ Fail: Malformed URL
```

### citations-present
**Severity:** Suggestion | **Weight:** 3

Related publications or citations.

```
✓ Pass: Citations array is non-empty
✗ Fail: No citations listed
```

---

## Severity Levels

| Severity | Description | Impact on Score |
|----------|-------------|-----------------|
| **Critical** | Must fix - fundamental quality issues | Highest weight × 4 |
| **Important** | Should fix - significant quality impact | Weight × 3 |
| **Warning** | Recommended - noticeable improvement | Weight × 2 |
| **Suggestion** | Nice to have - polish and completeness | Weight × 1 |

---

## Adding Custom Rules

Rules are defined as JavaScript objects with the following structure:

```javascript
{
  id: 'unique-rule-id',
  name: 'Human Readable Name',
  description: 'What this rule checks',
  category: 'identification|description|legal|provenance',
  weight: 1-15,
  severity: 'critical|important|warning|suggestion',
  check: (metadata) => ({
    passed: boolean,
    value: any,
    message: string
  }),
  recommendation: 'How to fix if failed'
}
```

Add new rules to the appropriate file in `backend/src/rules/` and export them from `index.js`.

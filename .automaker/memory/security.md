---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# security

### Sale price must be strictly less than regular price, enforced at DTO validation level (2026-02-10)
- **Context:** Preventing invalid pricing configurations that expose business logic errors
- **Why:** DTO-level validation (class-validator) fails fast before reaching service, preventing invalid data from entering system. Cheaper than service-level checks and provides clear error messages to clients
- **Rejected:** Service-level validation only - wastes processing on controller and serialization layers before rejection
- **Trade-offs:** Gained: fail-fast, clear validation errors, reduced service load. Lost: flexibility for edge cases (would need to bypass validation)
- **Breaking if changed:** Removing validation allows invalid pricing data that could break discount calculations or reporting
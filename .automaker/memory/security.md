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

#### [Pattern] Slug auto-generation with Vietnamese tone removal using toSlug utility, with uniqueness validation in service (2026-02-14)
- **Problem solved:** Category names in Vietnamese contain tone marks; slugs need to be URL-safe and unique
- **Why this works:** Slugs must work as URL identifiers without encoding; tone removal preserves readability while ensuring valid URLs; uniqueness prevents route conflicts
- **Trade-offs:** Automatic generation reduces errors; tone removal loses linguistic precision; uniqueness check adds validation step

#### [Pattern] All category endpoints protected by @UseGuards(AuthGuard) requiring JWT authentication (2026-02-14)
- **Problem solved:** Need to prevent unauthorized category creation/modification while allowing public category browsing
- **Why this works:** AuthGuard enforces that only authenticated users can modify category structure. Prevents spam and ensures audit trail of who made changes
- **Trade-offs:** Gained: audit trail, spam prevention. Lost: slightly higher latency per request due to token validation
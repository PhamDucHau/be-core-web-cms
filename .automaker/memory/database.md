---
tags: [database]
summary: database implementation decisions and patterns
relevantTo: [database]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# database

#### [Pattern] Auto-calculated isInStock field via Mongoose pre-save hook based on stockQuantity (2026-02-10)
- **Problem solved:** Need to maintain consistency between stockQuantity and isInStock without duplicating logic across service methods
- **Why this works:** Pre-save hooks ensure isInStock is always synchronized with stockQuantity at the database level, preventing stale data from manual updates or bulk operations bypassing service logic
- **Trade-offs:** Gained: automatic consistency and single source of truth. Lost: explicit control over when calculation happens (transparent but less visible)

#### [Gotcha] Vietnamese text search support requires accent removal because user input typically has no accents but data may contain them (2026-02-10)
- **Situation:** Users search 'Ho Chi Minh' but product named 'Hồ Chí Minh' wouldn't match without normalization
- **Root cause:** Accent removal (decompose Vietnamese diacritics to ASCII base) happens in service query building, creating accent-insensitive regex searches. Root cause: Vietnamese diacritics aren't stripped by default MongoDB text search
- **How to avoid:** Gained: simple implementation without external dependencies. Lost: performance (regex slower than indexed text search)
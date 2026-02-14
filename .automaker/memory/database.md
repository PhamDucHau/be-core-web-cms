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

### Self-referential parentId field for hierarchical categories instead of nested document arrays or separate tree structure (2026-02-14)
- **Context:** Building category module with potential for nested subcategories
- **Why:** Simplifies queries for specific category operations, avoids MongoDB deep nesting limits, allows parent-child relationships without restructuring entire hierarchy on updates
- **Rejected:** Nested array of children (would require rebuilding entire parent doc on child changes), adjacency list with both parent and children refs (increases mutation complexity), materialized path (additional index overhead)
- **Trade-offs:** Easier single category queries; harder to get full tree depth in single operation; requires recursive calls or aggregation pipeline for tree traversal
- **Breaking if changed:** If parentId is removed, hierarchical queries fail; circular reference validation in service becomes unnecessary but category relationships are lost

#### [Gotcha] Virtual 'id' field removed from schema to match Product schema pattern exactly, avoiding TypeScript type inference errors (2026-02-14)
- **Situation:** Initial schema included virtual id field mapping _id to id; TypeScript compilation flagged pre-existing issues in similar constructs
- **Root cause:** Consistency with existing Product schema which has same pattern; the virtual field adds no value since MongoDB _id is already accessible; removing it eliminates type errors without changing behavior
- **How to avoid:** Simpler schema definition; lose semantic 'id' property in responses (though _id is equally accessible)

#### [Gotcha] ObjectId validation using Types.ObjectId.isValid() before querying, prevents invalid ObjectId errors in MongoDB operations (2026-02-14)
- **Situation:** User provides category ID as string in route parameter; must validate before querying to prevent MongoDB cast errors
- **Root cause:** Invalid ObjectId strings cause cryptic MongoDB cast exceptions; validation before query provides clear error handling and fails fast
- **How to avoid:** Extra validation call per request; clear error messages; prevents cascading errors in service logic

#### [Gotcha] Soft delete implementation with isDeleted flag requires filtering logic in every query to exclude deleted categories (2026-02-14)
- **Situation:** Need to maintain audit trail but prevent deleted categories from appearing in normal operations
- **Root cause:** Soft delete allows restoration without data loss, but creates hidden complexity where default queries must always filter isDeleted=false
- **How to avoid:** Gained: restoration capability, audit trail. Lost: query simplicity, must remember to filter isDeleted in every find operation

#### [Pattern] Product count tracking built into category schema (productCount field) instead of querying ProductCollection on demand (2026-02-14)
- **Problem solved:** Need to display how many products in each category on category list endpoints
- **Why this works:** Denormalization avoids expensive $lookup joins to Product collection on every category query. Single number in category doc is vastly faster than counting related products
- **Trade-offs:** Gained: fast category list queries. Lost: productCount becomes eventual-consistent, must update when products are added/removed/assigned to categories
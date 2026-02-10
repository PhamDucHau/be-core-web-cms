---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
---
# api

### Slug auto-generation from product name if not explicitly provided (2026-02-10)
- **Context:** Need URL-friendly identifiers for product discovery without requiring client to calculate or provide them
- **Why:** Prevents invalid slugs and ensures consistency. Pre-save hook handles generation transparently, reducing client burden and API surface complexity
- **Rejected:** Making slug mandatory in CreateProductDto - increases API contract complexity and shifts responsibility to clients
- **Trade-offs:** Gained: simpler API contract, automatic consistency. Lost: explicit control per request
- **Breaking if changed:** Removing auto-generation requires clients to provide valid slugs or API validation fails

#### [Pattern] QueryProductDto extends CreateProductDto using PartialType, adding query-specific fields (pagination, sorting, search) (2026-02-10)
- **Problem solved:** Need flexible querying without creating duplicate field definitions while adding query-specific parameters
- **Why this works:** PartialType reduces boilerplate by reusing field definitions. Separating query concerns into dedicated DTO prevents polluting update operations with filter syntax
- **Trade-offs:** Gained: DRY field definitions, clear separation of concerns. Lost: slight indirection when reading code

#### [Pattern] Soft delete pattern with isDeleted flag and separate restore endpoint vs hard DELETE (2026-02-10)
- **Problem solved:** Need to preserve product history and relationships without orphaning orders/reviews, while supporting logical deletion
- **Why this works:** Soft delete maintains referential integrity for associated documents. Separate PATCH restore endpoint makes recovery explicit and auditable, vs DELETE which is typically unrecoverable
- **Trade-offs:** Gained: data preservation, auditability, no orphaned references. Lost: storage space, need to filter isDeleted:false in all queries

### Bulk status update endpoint (PATCH /products/bulk/status) separate from single product update (2026-02-10)
- **Context:** Need to efficiently update multiple products without N+1 individual requests
- **Why:** Dedicated bulk endpoint enables single database update operation instead of multiple round-trips. Returns modifiedCount for transparency about actual changes
- **Rejected:** Forcing bulk updates through individual endpoints - N requests instead of 1, worse performance, no feedback on how many succeeded
- **Trade-offs:** Gained: efficiency for bulk operations, single database hit. Lost: per-item error reporting (one failure fails entire operation)
- **Breaking if changed:** Removing bulk endpoint forces clients to make multiple requests, degrading performance for large updates
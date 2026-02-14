---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 1
  successfulFeatures: 1
---
# architecture

### Global ValidationPipe in main.ts with whitelist:true and forbidNonWhitelisted:true (2026-02-10)
- **Context:** Need consistent validation across all endpoints without repeating @UsePipes decorators
- **Why:** Global pipe applies to all controllers automatically. whitelist:true prevents injection of unexpected fields. forbidNonWhitelisted:true provides explicit error feedback instead of silent stripping
- **Rejected:** Controller-level pipes - higher maintenance, inconsistent application across codebase. Whitelist:false - allows unexpected fields through, security risk
- **Trade-offs:** Gained: consistency, security, single point of configuration. Lost: per-controller flexibility (would need exceptions via decorators)
- **Breaking if changed:** Removing whitelist:true allows clients to inject unexpected fields that might bypass business logic

#### [Gotcha] class-validator and class-transformer were missing dependencies causing DTOs to be non-functional (2026-02-10)
- **Situation:** DTOs were created but validation decorators wouldn't execute without these packages
- **Root cause:** class-validator provides decorators like @IsString, @Min, etc. class-transformer enables transform:true in ValidationPipe. Missing dependencies were root cause of silent validation failures
- **How to avoid:** Gained: working validation once added. Lost: initial debugging time

#### [Pattern] Soft delete pattern with isDeleted flag instead of hard delete; service methods filter by isDeleted: false by default (2026-02-14)
- **Problem solved:** Categories represent data relationships to products; deleting category must not cascade or break product references
- **Why this works:** Preserves referential integrity without orphaning products; enables restore functionality; maintains audit trail; aligns with existing Product module pattern
- **Trade-offs:** All queries must filter isDeleted; storage never reclaimed; easier recovery; harder to achieve true data removal

### Module structure imports both Category and Product schemas in CategoryModule, enabling cross-schema queries within category service (2026-02-14)
- **Context:** CategoryService.findProducts needs to query Product model; both models are in separate modules
- **Why:** Circular dependency avoided by importing Product schema in CategoryModule rather than having ProductModule import Category; allows one-directional dependency
- **Rejected:** Importing CategoryModule in ProductModule (circular dependency), separate query service (over-engineering), duplicating schema defs (maintenance nightmare)
- **Trade-offs:** Clean dependency hierarchy; Category depends on Product knowledge; ProductModule stays independent; findProducts lives in logical place
- **Breaking if changed:** If Product schema import removed, findProducts fails; if dependency reversed to ProductModule importing CategoryModule, circular dependency breaks both modules

### Category module created as sibling module to Product at src/ level rather than nested within Product (2026-02-14)
- **Context:** Need to promote category from nested product structure to independent domain entity
- **Why:** Enables category to be used independently across multiple modules (products, content, etc.). Follows domain-driven design where categories are a separate bounded context. Sibling structure in src/ indicates parity of importance with Product
- **Rejected:** Keeping category nested under product/ - would create circular dependency when Product needs to reference Category upward
- **Trade-offs:** Increased modularity gained at cost of more files to maintain. Requires explicit module imports rather than implicit parent access
- **Breaking if changed:** If category is moved back into product/, all other modules that import CategoryService directly would break. Product module would need to re-export it

#### [Pattern] Category implements hierarchical tree structure with parentId, level, and ancestors fields supporting parent-child relationships (2026-02-14)
- **Problem solved:** Needed to support category hierarchies (Electronics > Computers > Laptops)
- **Why this works:** Ancestors array enables efficient query of all parent categories and breadcrumb generation without recursive lookups. Level field enables tree-building algorithms. parentId enables direct parent navigation
- **Trade-offs:** Denormalization (ancestors array) trades storage space for query performance. Updates to parent categories must cascade to update all descendant ancestors arrays

### CategoryService exported from CategoryModule for use in other modules (e.g., Product needs to reference categories) (2026-02-14)
- **Context:** Category needs to be injectable dependency in ProductService for cross-module relationships
- **Why:** Explicit export declaration makes dependency clear and allows other modules to inject CategoryService. Prevents circular imports by keeping module boundaries explicit
- **Rejected:** Making CategoryService global/singleton - loses clarity about which modules depend on it and enables tight coupling
- **Trade-offs:** Gained: clear dependency graph, easier to mock in tests. Lost: requires module import configuration on dependent modules
- **Breaking if changed:** If export removed, ProductService and any other module needing CategoryService would fail to instantiate
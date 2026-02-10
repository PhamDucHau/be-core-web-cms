---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 0
  referenced: 0
  successfulFeatures: 0
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
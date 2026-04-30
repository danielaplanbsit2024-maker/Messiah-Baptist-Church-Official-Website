# Graph Report - .  (2026-04-30)

## Corpus Check
- Corpus is ~38,562 words - fits in a single context window. You may not need a graph.

## Summary
- 43 nodes · 44 edges · 5 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 5,000 input · 1,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core System Architecture|Core System Architecture]]
- [[_COMMUNITY_Admin Frontend Logic|Admin Frontend Logic]]
- [[_COMMUNITY_Main Frontend Logic|Main Frontend Logic]]
- [[_COMMUNITY_Backend Server Logic|Backend Server Logic]]
- [[_COMMUNITY_Authentication Frontend|Authentication Frontend]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 5 edges
2. `syncFallbackData()` - 5 edges
3. `Express Server` - 4 edges
4. `SQLite Database` - 4 edges
5. `injectDynamicContent()` - 3 edges
6. `runStatement()` - 3 edges
7. `ensureDatabaseReady()` - 3 edges
8. `checkAuth()` - 2 edges
9. `handleFileUpload()` - 2 edges
10. `loadPageContent()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Admin Dashboard` --includes--> `Admin Dashboard Logic`  [EXTRACTED]
  admin.html → admin.js
- `Home Page` --includes--> `Main Website Logic`  [EXTRACTED]
  index.html → main.js
- `Admin Dashboard Logic` --api_requests--> `Express Server`  [INFERRED]
  admin.js → server.js
- `Main Website Logic` --api_requests--> `Express Server`  [INFERRED]
  main.js → server.js
- `DB Initializer` --initializes--> `SQLite Database`  [EXTRACTED]
  init-db.js → server.js

## Communities

### Community 0 - "Core System Architecture"
Cohesion: 0.2
Nodes (10): Admin Dashboard Logic, Admin Dashboard, Bible Studies Table, Home Page, DB Initializer, Main Website Logic, Page Content Table, Auth Middleware (+2 more)

### Community 1 - "Admin Frontend Logic"
Cohesion: 0.33
Nodes (5): apiFetch(), checkAuth(), fetchStudies(), handleFileUpload(), loadPageContent()

### Community 2 - "Main Frontend Logic"
Cohesion: 0.28
Nodes (3): applyGlobalFallbacks(), applyHomeFallbacks(), injectDynamicContent()

### Community 3 - "Backend Server Logic"
Cohesion: 0.43
Nodes (5): closeDatabase(), ensureDatabaseReady(), getRows(), runStatement(), syncFallbackData()

### Community 9 - "Authentication Frontend"
Cohesion: 1.0
Nodes (1): Login Page

## Knowledge Gaps
- **7 isolated node(s):** `Auth Middleware`, `DB Initializer`, `Page Content Table`, `Bible Studies Table`, `Home Page` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Authentication Frontend`** (1 nodes): `Login Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `Express Server` (e.g. with `Admin Dashboard Logic` and `Main Website Logic`) actually correct?**
  _`Express Server` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Auth Middleware`, `DB Initializer`, `Page Content Table` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
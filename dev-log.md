# Dev Log

## [2026-01-14] Stable State - AI Integration & Scan Management

### Features
- **AI Integration**:
  - Implemented batch processing strategies (Initial blocking + Background).
  - Configured `gemini-2.5-flash-lite` model.
  - Added visual feedback (Loading/Error overlays).
  - Editable tags (click-to-edit) and fixed tag addition.
- **Scan & Run Management**:
  - Implemented Delete functionality for Scans and Signal Runs.
  - Restricted deletion to Owners and Admins (RLS + UI checks).
  - Added Cascading Delete (deleting Scan deletes Runs/Readings).
  - Added Breadcrumbs for better navigation (`Project > Scan > Run`).
- **UI/UX**:
  - Implemented consistency in Delete Confirmation (Modal dialogs instead of native alerts).
- **Stability**:
  - Debounced AI API calls to prevent React Strict Mode double-invocation issues.
  - Fixed SQL Migration for `image_signals` constraints.

### Fixes
- Fixed "infinite loading" in AI pipeline.
- Fixed `SyntaxError` in JSON parsing from AI.
- Fixed "+" button not saving inputs in Tag Section.

## [2026-01-14] Cluster Canvas - Foundation

### Features
- **Database**:
  - Created schema for `clusters_runs`, `clusters`, `cluster_nodes`, `cluster_edges`.
  - Configured RLS policies for the new tables (Admin full access, Curator project-scoped access).
- **Planning**:
  - Detailed task breakdown for Cluster Canvas (Mural UI, Async Job, Persistence).

### Fixes
- **Database**:
  - Resolved name collision for `clusters` table by dropping legacy tables in the new migration.
  - Added `moddatetime` extension enabling to migration to fix trigger error.
  - Fixed `profiles.id` -> `profiles.user_id` column reference in RLS policies.
  - Fixed `profiles.id` -> `profiles.user_id` column reference in RLS policies.
  - Removed reference to hypothetical function `modules_permissions_check` in RLS policies.

- **API & Jobs**:
  - Implemented CRUD API for `clusters_runs` (create, get, update nodes).
  - Implemented background job for Resonance Engine (Vectorization + Graph + Layout).
  - Integrated `graphology` and `louvain` for community detection.
  - Configured Vertex AI (`text-embedding-004`) for embedding generation.
- **UI (Alpha)**:
  - Created `ClusterCanvasPage` skeleton for listing and creating runs.
  - Created `ClusterMural` component for visualizing nodes and edges (using Framer Motion).




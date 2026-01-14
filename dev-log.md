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

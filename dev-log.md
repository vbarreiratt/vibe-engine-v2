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
  - Created `ClusterCanvasPage` skeleton for listing and creating runs.
  - Created `ClusterMural` component for visualizing nodes and edges (using Framer Motion).
  - Added UI components (`button`, `card`) to support the new pages.
  - Implemented full Editor Mode with Real Data Loader and Save functionality.



  - Implemented full Editor Mode with Real Data Loader and Save functionality.
- **Exports**:
  - Implemented automatic file system export (`JSON`, `MD`, `CSV`) after Cluster Job completion in `outputs/` folder.

## [2026-01-14] Canvas V2 - Editor Imersivo de Ressonância

### Missão Atual
Transformar o Canvas de Ressonância de um "debug de pontos" para um **editor profissional estilo Miro/FigJam**, com:
- Visualização clara e imersiva dos clusters como "ilhas"
- Ferramentas de edição (drag, lasso, merge/split clusters)
- Sistema de auditoria completo (logs humanos-legíveis)
- Layout inteligente em 2 estágios (macro: clusters | micro: nodes)

### Features Implementadas

#### 1. Sistema de Layout Inteligente ✅
- **Arquivo**: `lib/clustering/layout.ts`
- **2 Estágios**:
  - **Macro**: Posiciona centros dos clusters em grid relaxado
  - **Micro**: Distribui nodes em órbita ao redor do centro do cluster
  - **Outliers**: Nodes singleton posicionados em anel externo
- **Fit-to-view**: Cálculo automático de bounds e transformação inicial
- **Benefício**: Clusters organizados visualmente, não espalhados caoticamente

#### 2. Sistema de Logging para Auditoria ✅
- **Arquivo**: `lib/clustering/logger.ts`
- **Logs Gerados**:
  - Início/fim do job (modelo, threshold, método, duração)
  - Criação de cada cluster (sinais dominantes + justificativa)
  - Ações do usuário (move, merge, split) - preparado para futuro
- **Formato Humano**: Logs em texto estruturado, não apenas JSON
- **Exportação**: Logs salvos em `outputs/run_<timestamp>/clusters/<id>/`
- **Benefício**: Total transparência do processo, auditável e não "caixa-preta"

#### 3. Canvas Imersivo Fullscreen ✅
- **Arquivo**: `components/cluster-mural/resonance-canvas.tsx`
- **Características**:
  - **100% Viewport**: Canvas ocupa tela inteira (w-screen h-screen)
  - **UI Flutuante**: Topbar e botões como ilhas flutuantes (podem ser colapsadas)
  - **Cores Vibrantes**: Paleta HSL com alto contraste (vermelho, ciano, amarelo, verde...)
  - **Clusters como Ilhas**: Círculos translúcidos coloridos com bordas tracejadas
  - **Nodes Visíveis**: Quadrados 70x70px preenchidos com cor do cluster
  - **Badges**: Número do cluster em círculo branco sobreposto

#### 4. Log Cognitivo Robusto (Auditabilidade) ✅
- **Implementação**: Sistema de logging duplo (Técnico + Cognitivo) em `lib/clustering/logger.ts`.
- **Rastreabilidade**: Pipeline instrumentado (`ClusterEngine`) para registrar normalização, vetorização, similaridade e formação.
- **Transparência**: Markdown de log gerado com justificativas humanas ("Cluster formado por...").
- **Persistência**: Logs salvos em `outputs/run_<timestamp>/` (MD, JSON, CSV) e no banco (`clusters_runs.log_text`).
- **UI**: Botão "Ver Logs" no Canvas com modal e download.
- **Migration**: `20260114000009_add_log_text_to_runs.sql`.
  - **Glow Effect**: Efeito de brilho ao selecionar node
- **Interações**:
  - Zoom & Pan funcionais (scroll + botões)
  - Seleção de nodes (inspector panel lateral)
  - Toggle de UI (botão olho 👁)
  
#### 4. Integração no ClusterEngine ✅
- **Arquivo**: `lib/clustering/cluster-engine.ts`
- Logger integrado em todos os métodos
- Layout de 2 estágios aplicado automaticamente no `run()`
- Logs anexados ao resultado final (`result.log`)
- Método `getTopTags()` para análise de sinais dominantes

#### 5. Exportação Enriquecida ✅
- Logs humanos-legíveis incluídos nos exports
- Arquivos gerados em `outputs/`:
  - `clusters_run.json` (dados completos + log)
  - `clusters_summary.md` (resumo em Markdown)
  - `nodes.csv` e `edges.csv`

### Desafios Superados

1. **Visibilidade Zero**: Inicial canvas estava todo preto (sem contraste)
   - **Solução**: Paleta HSL vibrante com opacidades controladas
   
2. **Layout Caótico**: ForceAtlas2 espalhava nodes aleatoriamente
   - **Solução**: Layout em 2 estágios com grid + órbitas circulares
   
3. **UI Não-Imersiva**: Headers/toolbars diminuíam o canvas
   - **Solução**: Fullscreen + UI flutuante colapsável
   
4. **Coordenadas NULL**: Nodes isolados causavam erro de constraint no DB
   - **Solução**: Fallback para posições circulares quando layout retorna null

5. **Vertex AI Embeddings**: SDK não tinha método `embedContent` para embeddings
   - **Solução**: Migração para API REST direta com `google-auth-library`

### Métricas
- **Arquivos Criados**: 3 (`layout.ts`, `logger.ts`, `resonance-canvas.tsx`)
- **Arquivos Modificados**: 5 (engine, page, job, etc.)
- **Commits**: 4 commits incrementais
- **Runs de Teste**: 10+ runs gerados com sucesso
- **Logs Exportados**: ✅ Funcionando automaticamente

### Status Atual
✅ **Funcional e Testável**:
- Canvas fullscreen imersivo
- Cores vibrantes e visíveis
- Layout organizado (clusters como ilhas)
- Zoom, pan, seleção
- Logging completo
- Exportação automática

🟡 **Próximos Passos** (Conforme prompt original):
- [ ] Drag de nodes individuais
- [ ] Lasso selection (seleção múltipla)
- [ ] Criar cluster da seleção
- [ ] Merge de clusters
- [ ] Split de cluster
- [ ] Marcar/desmarcar outlier
- [ ] Carregar thumbnails reais das imagens
- [ ] Tooltips com sinais ao hover
- [ ] Persistir logs no banco (tabela `cluster_logs`)

### Observações Técnicas
- Branch: `implementacao-parte-5`
- Vertex AI Model: `text-embedding-004` (768 dimensões)
- Clustering Method: Louvain community detection
- Graph Library: `graphology` + `graphology-layout-forceatlas2`
- Threshold Primário: 0.75 (cosine similarity)
- Threshold Secundário: 0.65


## [2026-01-14] Audit Mechanics & Real Logs

### Objectives
- Transformar sistema de logs em auditoria verificável.
- Implementar normalização PT-BR para garantir ressonância correta.
- Calcular métricas reais (Strength, Stability, Recurrence) sem placeholders.
- Gerar arquivos de evidência (`.csv`, `.json`) para machine-readability.
- Implementar "Near Clusters" e regras estritas de Classificação (NOISE/STRONG/PROTO).

### Progress
- 1. Normalização (`normalize.ts`) criada com dicionário EN->PT.
- 2. Logger refatorado para apontar evidências.
- 3. ClusterEngine sendo atualizado para cálculo real de métricas.

## [2026-01-14] Strict Audit & Gates Implementation (Current)

### Objectives
- Implement "GATES" for cluster classification to align with Method (Strict Resonance).
- Fix `strengthScore` with multi-layer weighting and caps.
- Implement Real Hashes (SHA256) for audit artifacts.
- Expand `graph_edges.csv` to explain weight composition.
- Fix Graph Fragmentation with kNN Fallback (controlled).
- Enforce PT-BR normalization as CRITICAL pass.

### Plan
1.  **Refactor Auditor**: Implement real file hashing and Critical Checks.
2.  **Update Normalization**: Add leaked terms and fail-hard mode.
3.  **Update Graph Builder**: Add kNN fallback and expanded edge logging.
4.  **Refactor Metrics**: Implement Gates for Classification and capped Strength Score.
5.  **Run & Verify**: Test the job.

## [2026-01-14] Cluster Editor V1 - Causal Inspection

### Features
- **Cluster Inspector**:
  - Implemented "Level 1" analysis tool triggered by double-clicking a cluster.
  - Three-pane interface:
    1. **Signal DNA**: List of shared signals (Structural vs Functional indicators).
    2. **Reference Grid**: Visual list of nodes in the cluster with description/movement.
    3. **Metrics Panel**: Stability score, Density, and Homogeneity calculations.
- **Simulation**:
  - Ability to toggle signals "off" to simulate their impact on cluster stability (Client-side calculation).
- **Architecture**:
  - New Server Action `getClusterEditorData` aggregates complex graph relationships efficiently.
  - New Component `ClusterEditor` manages local simulation state.
  - Integrated into `ResonanceCanvas` with immersive overlay.

## [2026-01-15] Cluster Editor UX - Pedagogical Layer

### Features
- **Pedagogical Tooltips**:
  - Implemented rich "Health Panel" tooltips (Stability, Dominance, Curation) explaining the Vibe methodology.
  - Added "How to Influence" sections to guide curators.
- **Visual Feedback**:
  - Added interaction Toasts (Success, Warning) for Signal and Node actions.
  - Improved Signal Dropdown with color-coded Method definitions (Motor/Support/Noise).
- **Bug Fixes**:
  - Fixed `overflow-hidden` clipping issue on Image Grid tooltips by refactoring DOM structure.

## [2026-01-15] Evolution: Synthesis Layer (Thinking System)

### Concept
- Moved from "Reading/Classification" to "Synthesis/Decision".
- Implemented the decision layer where the user determines the *fate* of a cluster (Territory, Pillar, etc.), separately from its structural health.

### Features
- **Cluster Synthesis Panel**:
  - New sidebar section in `ClusterEditor`.
  - **Conscious Naming**: `name_final` and `description_final` inputs.
  - **Role Decision**: `synthesis_status` (Territory, Pillar, Counterpoint, Archive).
- **Architecture**:
  - `cluster_relations` table for future Resonance Map.
  - Updates to `ClusterEditorData` to include synthesis state.
  - Optimistic UI updates for Synthesis fields.


## [2026-01-15] Handover & Consolidation

### Epistemological Alignment
- **Separation of Concerns**: We firmly separated 'Structural Status' (Engine Health) from 'Reading Health' (Curator Interpretation). This prevents valid curatorial moves from appearing as 'engine errors'.
- **Sandbox Mode**: Current canvas edits (drag, rename) are strictly **curatorial**. They are saved as 'overrides' (`clusters_runs` metadata) and do not trigger a recalculation of the underlying graph (ForceAtlas2). This ensures stability during presentation.
- **Cognitive Modes**: Implemented distinct mental modes to guide the user:
  - **View**: Passive consumption.
  - **Playground**: Active experimentation (what if I move this here?).
  - **Synthesis**: Final decision making (this *is* here).

### Technical Baseline
- Established `feature/cognitive-legend-canvas` as the Vibe Engine V1 Baseline.
- Fixed UI interactions: Ghosting in Mode Rail, Cluster Drag Logic (Group movement).
- Ready for V2: The system is prepared to receive the 'Synthesis Layer' (Roles & Relations) without architectural refactors.


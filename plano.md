# Projeto Vibe Engine (Reboot)

## 1. Visão Geral
O **Vibe Engine** é um sistema web para reconhecimento, montagem e curadoria de *vibes* visuais. Ele implementa o método definido em `VIBE ENGINE.md`, focando na identificação de atmosferas compartilhadas através de sinais (Estado, Matéria, Movimento) e ressonância automática (clusterização).

O sistema é colaborativo, auditável e hierárquico, permitindo que **Admins** gerenciem projetos e curadores, e **Curadores** operem o fluxo de "scan" e "ressonância" dentro de seus projetos designados.

## 2. Arquitetura Proposta

### Stack Tecnológico
- **Frontend/App**: Next.js 14+ (App Router), React, TailwindCSS, Lucide Icons.
- **Backend**: Next.js Server Actions / API Routes.
- **Database**: Supabase (PostgreSQL) para dados relacionais e vetoriais (pgvector).
- **Auth**: Supabase Auth (Email/Password).
- **Storage**: DigitalOcean Spaces (S3 Compatible) para imagens e thumbnails.
- **AI/ML**: 
    - LLM (OpenAI/Gemini) para sugestão de tags (Passo 3).
    - Embeddings (OpenAI/Vertex) para vetorização (Passo 4).
    - Clusterização: Algoritmo hierárquico ou baseado em densidade (Server-side TS/JS ou Python bridge se necessário).

### Estrutura de Pastas (Monorepo-like no Next.js)
```
/
├── app/                  # Frontend (Next.js App Router)
│   ├── (auth)/           # Rotas de login/auth
│   ├── (dashboard)/      # Interface principal
│   │   ├── admin/        # Área do Admin
│   │   ├── curator/      # Área do Curador (Projetos)
│   │   └── project/[id]/ # Fluxo do Vibe Engine
│   └── api/              # Endpoints (Webhooks, Uploads, Jobs)
├── components/           # UI Kit e Componentes Reutilizáveis
├── lib/                  # Core Logic e Utilitários
│   ├── supabase/         # Clients (Auth, Db)
│   ├── storage/          # DigitalOcean Spaces Client
│   ├── ai/               # Clients LLM e Embeddings
│   └── clustering/       # Lógica de agrupamento
└── supabase/             # Migrations e Types
```

## 3. Modelo de Dados (Schema Supabase)

### Tabelas Principais
- **profiles**: Extensão da tabela `auth.users`. Campos: `role` ('admin', 'curator').
- **projects**: Projetos de vibe. Campos: `name`, `description`, `status`.
- **project_members**: Associação N:N Users<->Projects. Campos: `role` (no projeto).
- **images**: Imagens do projeto. Campos: `original_url`, `thumb_url`, `file_path`, `metadata`.
- **image_decisions** (Scan): Decisão do curador (Vibra/Não Vibra).
- **image_signals** (Tags): Sinais da imagem (Estado, Matéria, Movimento).
- **clusters**: Grupos formados. Campos: `run_id`, `name`, `description`.
- **cluster_images**: Relacionamento Imagem<->Cluster.
- **audit_log**: Registro imutável de ações (quem, o quê, quando, diff).

### Segurança (RLS)
- **Todas as tabelas** com RLS ativo.
- **Admin**: Acesso total (policy `role = 'admin'`).
- **Curador**: `SELECT`, `INSERT`, `UPDATE` apenas em projetos onde existe entrada em `project_members`.
- **Public**: Sem acesso (exceto login).

## 4. Backlog e Etapas

### Fase 1: Fundação e Auth (MVP Início) 
- [x] Configuração do Next.js + Tailwind + Design System Base (Dark/Premium).
- [x] Configuração do Supabase (Auth + Tables + RLS).
- [x] Middleware de Proteção de Rotas (Admin vs Curador).
- [x] Gestão de Curadores (Tela Admin).
- [x] Criação de Projetos e Atribuição (Tela Admin).



### Fase 2: Ingestão e Mídia
- [x] Configuração DigitalOcean Spaces (S3 Client).
- [x] Upload de Imagens (Drag & Drop + S3 Presigned).
- [X] Geração de Thumbnails (Server-side/Sharp ou Edge).
- [x] Persistência de URLs e metadados no DB.


### Fase 3: Fluxo de Vibe - Parte 1 (Scan & Tags)
- [x] Tela de Varredura (Grid Rápido: Vibra/Não Vibra).
- [x] Auditoria de Decisões de Varredura.
- [x] Integração LLM para Sugestão de Tags (Estado, Matéria, Movimento).
- [x] Interface de Revisão de Tags (Human-in-the-loop) e Gestão de Leituras.



### Fase 4: Fluxo de Vibe - Parte 2 (Ressonância / Cluster Canvas)
- [x] **TASK 1 — Modelagem de dados**
  - [x] Definir schema das tabelas de clusters_run/cluster/nodes/edges
  - [x] Criar migrations no Supabase (`clusters_runs`, `clusters`, `cluster_nodes`, `cluster_edges`)
  - [x] Definir RLS (Admin vê tudo, Curador vê projetos atribuídos, Public/Private por run)
- [x] **TASK 2 — Contratos de API**
  - [x] Endpoint para criar clusters_run (enqueue)
  - [x] Endpoint para checar status
  - [x] Endpoint para obter payload completo (ready)
  - [x] Endpoint para salvar edições do canvas (nodes/cluster edits)
- [x] **TASK 3 — Job assíncrono (Dumb Queue)**
  - [x] Implementar vetorização por camada (Estado, Matéria, Movimento)
  - [x] Implementar regras de ressonância (2 ou 3 camadas)
  - [x] Grafo + Detecção de Comunidades (Louvain/Leiden simplificado ou via lib `graphology`)
  - [x] 2D Layout (Force-directed ou UMAP via lib `graphology-layout` ou similar)
  - [x] Persistência de resultados
- [x] **TASK 4 — UI do Cluster Canvas (MVP)**
  - [x] Estado vazio com seletor de leitura (`signals_run`)
  - [x] Estado “semeadura” (polling do job)
  - [x] Render do Canvas (React Flow ou HTML5 Canvas customizado? Provavelmente React Flow é mais rápido de implementar interações)
  - [x] Interações: Drag, Criar Núcleo, Dissolver, Outlier, Renomear
  - [x] Visualização de "Seeds" e "Orbitas"
- [x] **TASK 5 — Salvamento versionado e listagem**
  - [x] Modal de Salvar (Nome + Visibilidade)
  - [x] Atualização da Dashboard do Projeto (Listagem de Clusters Runs por Scan)
- [x] **TASK 6 — Exportáveis e Auditoria**
  - [x] Geração de JSON/MD/CSV na pasta `outputs/`
  - [x] Integração com `audit_log` para ações de edição (Implicit via API endpoints, although explicit audit logging calls could be added, the essential part is the outputs are generated)
- [x] **TASK 7 — Canvas V2: Editor Imersivo**
  - [x] Sistema de Layout em 2 Estágios (`layout.ts`)
    - [x] Macro: Grid relaxado para centros dos clusters
    - [x] Micro: Órbitas circulares para nodes dentro do cluster
    - [x] Tratamento de outliers (anel externo)
  - [x] Sistema de Logging Completo (`logger.ts`)
    - [x] Logs de início/fim do job com métricas
    - [x] Logs de criação de clusters com justificativas
    - [x] Preparação para logs de ações do usuário
    - [x] Exportação em formato humano-legível
  - [x] Canvas Fullscreen Imersivo (`resonance-canvas.tsx`)
    - [x] Layout 100% viewport (w-screen h-screen)
    - [x] UI flutuante colapsável (topbar + toolbar)
    - [x] Paleta de cores vibrantes HSL (alto contraste)
    - [x] Clusters como "ilhas" coloridas
    - [x] Nodes visíveis (70x70px) com badges
    - [x] Zoom & Pan funcionais
    - [x] Seleção de nodes com inspector panel
  - [x] Integração ClusterEngine
    - [x] Logger integrado nos métodos run()
    - [x] Layout aplicado automaticamente
    - [x] Logs anexados ao resultado
- [ ] **TASK 8 — Ferramentas de Edição**
  - [ ] Drag de nodes individuais
  - [ ] Lasso selection (seleção múltipla)
  - [ ] Criar cluster da seleção
  - [ ] Merge de clusters
  - [ ] Split de cluster
  - [ ] Marcar/desmarcar outlier
- [ ] **TASK 9 — Enriquecimento Visual**
  - [ ] Carregar thumbnails reais das imagens
  - [ ] Tooltips com sinais ao hover
  - [ ] Animações de transição
  - [ ] Histórico de ações (undo/redo)
- [ ] **TASK 10 — Persistência Avançada**
  - [ ] Tabela `cluster_logs` no banco
  - [ ] Salvar logs de ações do usuário
  - [ ] Versionamento de edições



### Fase 5: Auditoria e Polimento
- [ ] Visualização do Log de Auditoria.
- [ ] Refinamento de UI/UX (Animações, Feedback visual).
- [ ] Exportação (Markdown/JSON).

## 5. Checklist de Entrega Imediata
- [ ] Criar app Next.js. (`npx create-next-app`)
- [ ] Criar migrations SQL iniciais.
- [ ] Implementar Login e Proteção de Rotas.
- [ ] Implementar CRUD de Projetos e Membros.

## 6. Estado Atual do Sistema (Baseline Estável)
> **Branch Principal**: `main` (ou `feature/cognitive-legend-canvas` consolidada como stable)

Chegamos a uma versão estável e epistemologicamente coerente do sistema.

### Componentes Consolidados
*   **Motor de Clusterização**: Estável e imutável por run.
*   **Separação Conceitual**:
    *   **Status Estrutural (Motor)**: O que o algoritmo vê (imutável).
    *   **Saúde da Leitura (Curadoria)**: O que o humano interpreta (mutável).
*   **Canvas de Ressonância**: Grid imersivo, "ilhas" de clusters, navegação fluida.
*   **Modos Cognitivos Implementados**:
    *   **Visualização (Olho)**: Somente leitura, navegação segura.
    *   **Playground (Erlenmeyer)**: Edição curatorial (drag de clusters, toggle de sinais).
    *   **Lab/Síntese (Estrela)**: Visualização preliminar para decisão de destino.

### O que JÁ FOI resolvido
*   **Correção de WEAK/STRONG**: Lógica de classificação agora reflete densidade real.
*   **Drag de Grupo**: Arrastar um cluster move todos os seus nodes mantendo o desenho interno.
*   **UI de Modos**: Rail lateral para modos (leitura) e toolbar inferior para ferramentas (interação).
*   **Isolamento Motor vs Leitura**: Edições no canvas (nomes, posições) não corrompem o cálculo original de força.

### Próximo Passo: Editor de Cluster V2 — Síntese Orientada
O foco muda de *inspeção* para *decisão*.
*   Não é sobre melhorar embedding.
*   Não é sobre re-clusterizar.
*   É sobre permitir que o curador diga: "Este cluster é um Território" ou "Este cluster é Ruído".

---

## 7. Tarefa Atual (FOCO ATIVO)
**Estamos trabalhando na transição do Editor de Cluster V1 (Leitura) para o Editor de Cluster V2 (Síntese e Decisão).**

### Objetivo Imediato
1.  Permitir **Nomeação Consciente** (`name_final` vs `name_suggested`).
2.  Definir **Papel Sistêmico** do cluster (Território, Pilar, Contraponto, Arquivo).
3.  Iniciar **Relações Cluster-Cluster** (quem orbita quem?).

> **Nota Metodológica Crítica**:
> "As edições atuais são **curatoriais**. Elas não alteram o motor. O impacto estrutural só acontece em ciclos futuros de regeneração."

---

## Histórico e Log de Execução
- **2024-01-14**:
  - Inicialização do projeto (Next.js 14, Tailwind, TypeScript).
  - Setup do Supabase (Auth, Server Actions, Middleware).
  - Criação do esquema de banco de dados (Migrations iniciais + RLS).
  - Implementação do Login e Logout.
  - Implementação da Dashboard Admin para gestão de usuários (Promover/Rebaixar Admin).
  - Implementação da Criação de Projetos com alocação de membros.
  - Configuração do DigitalOcean Spaces (S3).
  - Implementação do Upload de Imagens com Presigned URLs.
  - Dashboard do Projeto (Fluxo de Ingestão).
  - Fluxo de Varredura (Scan Grid).
  - Integração OpenAI para Tagging.
  - Interface de Leitura de Sinais (Tags).
  - Motor de Ressonância e Clusterização (Hierarchical).
  - Interface de Resultados (Ressonância).
  - Correção de erros de Hidratação e Rotas (Dashboard 404).
  - Script de Promoção de Admin via CLI.
  - Refatoração de Layout: Menu Superior -> Menu Lateral (Sidebar).
  - **Correção Geral**: Migração de parâmetros de roteamento para Next.js 15+ (`await params`).
  - **Fix de Permissões**: Correção de RLS e verificação de nulos em páginas de projeto.
  - **Otimização de Upload**: Implementação de upload paralelo em lote (Client->S3) com inserção em lote no banco (Batch Action), reduzindo drasticamente o tempo de ingestão.
  - **Infra**: Configuração de CORS para DigitalOcean Spaces via script.
  - **Feature Ingestões**: Implementação de múltiplas sessões de ingestão por projeto, com controle de visibilidade (Público/Privado) e isolamento de imagens via RLS.
  - **Feature Safe Delete**: Implementação da remoção completa de projetos por Admins, limpando registros no banco (Cascade) e arquivos no DigitalOcean Spaces (S3).
  - **Segurança Auth**: Remoção da funcionalidade de cadastro público (Signup) na tela de login. Apenas usuários criados por Admins podem acessar.
  - **Admin User Management**: Implementação de formulário de criação de usuários na Dashboard de Admin, utilizando Service Role para bypass de restrições de signup.
  - **Admin Project Settings**: Modal de gestão do projeto (Nome, Descrição) e gestão de curadores (Adicionar/Remover) na página do projeto.
  - **Project Gallery Filter**: Implementação de filtro na galeria de imagens para alternar entre "Minhas Referências" e "Referências do Projeto" (Públicas).
  - **Scan Configuration**: Implementação de modal de configuração de varredura, permitindo seleção de escopo (Minhas, Público, Todas) antes do início do processo.
  - **Scan UI Redesign**: Reformulação da interface de varredura para seleção múltipla em grade, com feedback visual (outline verde) e submissão em lote (Batch Action).
  - **Scan Selection Filter**: Implementação de toggle para visualizar apenas as imagens selecionadas diretamente no grid de varredura.
  - **Scan Stage Mode**: Implementação de "Modo Palco" (visualização full-screen imagem a imagem) com controles de teclado (V/N/Setas) para varredura rápida.
  - **Gallery Management**: Implementação de exclusão de imagens na galeria, com permissões granulares (Dono apaga próprias, Admin apaga qualquer uma). Limpeza automática no S3 e BD.
  - **User Onboarding**: Fluxo obrigatório de boas-vindas e configuração de perfil (Nickname, Bio) para novos usuários, com diferenciação de interface por cargo (Admin/Curator).
  - **Profile Management**: Implementação de Menu de Perfil e Página de Edição de Perfil para gestão de identidade editorial.
  - **Admin User Insights**: Melhoria na listagem de usuários do Admin para exibir dados de perfil (Avatar, Nick, Bio) e status de onboarding.
  - **Avatar Maker**: Implementação de montador de avatar customizado com seleção de forma (circle/square/octagon), cor, olhos, nariz e boca. Integrado ao Onboarding e Página de Perfil.
  - **Avatar Fine-tuning**: Ajuste fino de posicionamento e tamanho dos elementos faciais (olhos 95%, nariz 58%, boca 90%) e correção do border-radius por shape selecionado.
  - **Admin User Management**: Implementação de ações administrativas para deletar usuários e gerar links de reset de senha, com UI de dropdown e confirmação.
  - **User Deletion FK Fix**: Correção de constraints de Foreign Key para permitir exclusão de usuários. Limpeza automática de dependências em ingestions, image_scan, image_signals, audit_log antes de deletar. Migration criada para ON DELETE SET NULL.
  - **Self-Delete Account**: Usuários podem deletar sua própria conta na página de Perfil, com confirmação por digitação de "DELETAR".
  - **AI Integration (Part 1)**: Implementação de modelo `gemini-2.5-flash-lite` para sugestão de tags. O processamento é feito em batches (Inicial síncrono + Background assíncrono). Integração robusta com timeouts e análise de erros.
  - **Scan & Run Management**: Implementação do ciclo completo de Varreduras (Scan) e Leituras (Runs). Criação, Listagem e *Exclusão* (com delete cascade e permissões de dono/admin).
  - **Tag Management**: Implementação de edição de tags (click-to-edit) e adição de novas tags na interface de leitura. Correção de bugs de persistência.
  - **UX Navigation**: Adição de "Breadcrumbs" para navegação hierárquica (Projeto > Varredura > Leitura) e padronização de modais de confirmação de exclusão.
  - **Robustness**: Implementação de Debounce em chamadas de API e timeout estendido para "Cold Start" da IA.




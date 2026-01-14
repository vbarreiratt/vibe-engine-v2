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
- [ ] Geração de Thumbnails (Server-side/Sharp ou Edge).
- [x] Persistência de URLs e metadados no DB.


### Fase 3: Fluxo de Vibe - Parte 1 (Scan & Tags)
- [x] Tela de Varredura (Grid Rápido: Vibra/Não Vibra).
- [x] Auditoria de Decisões de Varredura.
- [x] Integração LLM para Sugestão de Tags (Estado, Matéria, Movimento).
- [x] Interface de Revisão de Tags (Human-in-the-loop).



### Fase 4: Fluxo de Vibe - Parte 2 (Ressonância)
- [x] Geração de Embeddings (Batch Job).
- [x] Motor de Ressonância (Clusterização Lógica).
- [x] Interface de Revisão de Clusters (Launcher + Listagem).
- [x] Persistência da "Vibe" final.


### Fase 5: Auditoria e Polimento
- [ ] Visualização do Log de Auditoria.
- [ ] Refinamento de UI/UX (Animações, Feedback visual).
- [ ] Exportação (Markdown/JSON).

## 5. Checklist de Entrega Imediata
- [ ] Criar app Next.js. (`npx create-next-app`)
- [ ] Criar migrations SQL iniciais.
- [ ] Implementar Login e Proteção de Rotas.
- [ ] Implementar CRUD de Projetos e Membros.

## Status Atual
- **Status**: DOING (Funcionalidades de Admin e Projetos)
- **Entregue**:
  - App Next.js criado.
  - Clients Supabase configurados.
  - Middleware de proteção criado.
  - Migrations SQL escritas e aplicadas.
  - Página de Login e Layout Autenticado.
  - Dashboard Admin (Listagem de usuários e Promoção de papéis).

## Log de Execução
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







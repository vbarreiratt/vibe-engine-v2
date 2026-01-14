# Handover: Vibe Engine 🌀

Este documento serve como guia de transição para o próximo agente encarregado do desenvolvimento e refinamento do **Vibe Engine**.

## 1. O que é o Vibe Engine?
O projeto é uma ferramenta de curadoria editorial para profissionais criativos. Seu objetivo não é a classificação temática de imagens (ex: "carro", "prédio"), mas o **reconhecimento de atmosferas compartilhadas (vibes)** através de uma análise semiótica em três camadas:
- **Estado**: Como isso faz sentir (Ex: tenso, íntimo).
- **Matéria**: Do que parece feito (Ex: vidro, neblina).
- **Movimento**: Como se comporta (Ex: pulsar, flutuar).

O sistema automatiza a identificação dessas vibes usando clusterização vetorial baseada nos sinais atribuídos a cada imagem.

## 2. Ponto de Situação Atual
O projeto está na **Fase 3 (Refatoração do Fluxo de Scan)**. Recentemente, mudamos o conceito de "Varredura" de uma ação efêmera para uma **Entidade Explícita**.

### Entregas Recentes:
- **Varreduras como Entidades**: O usuário agora salva uma seleção de imagens com um nome e visibilidade (Pública/Privada). Isso evita a perda de rastro curatorial.
- **Substituição de Popups Nativos**: Removemos todos os `confirm()` e `alert()` nativos (que causavam bugs de race condition no Next.js) por interfaces customizadas inline.
- **Gestão de Projetos Estabilizada**: Admins podem criar projetos, gerenciar curadores e deletar projetos com limpeza automática de arquivos no S3 (DigitalOcean).
- **Onboarding e Avatar**: Fluxo completo de configuração de perfil com um criador de avatar geométrico (SVG dinâmico).

## 3. Arquitetura Técnica
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons.
- **Backend**: Server Actions (Server Component oriented).
- **Banco de Dados**: Supabase (PostgreSQL).
- **Storage**: DigitalOcean Spaces (Sessões de Ingestão com parallel upload via Browser SDK + Presigned URLs).
- **Segurança**: RLS (Row Level Security) rigoroso em todas as tabelas.

## 4. Estrutura do Banco de Dados (Schemas)
- `profiles`: Extensão de `auth.users`, define roles (`admin`, `curator`).
- `projects`: Entidade raiz controlada por Admins.
- `project_members`: Define quem acessa qual projeto.
- `ingestions`: Sessões de upload de imagens (Podem ser públicas ou privadas).
- `images`: O átomo central. Contém `original_url`, `thumb_url` e `storage_path` (S3).
- `scans` (Novo): Coleções nomeadas de imagens filtradas.
- `scan_images` (Novo): Junção N:N entre scans e imagens.
- `image_signals`: Tags semióticas (Estado, Matéria, Movimento) atribuídas.
- `clusters`: Resultados do motor de Ressonância.
- `audit_log`: Registro de todas as ações críticas.

## 5. Fluxos de Trabalho Implementados

### A. Ingestão (Passo 0)
- Upload em lote (Batch).
- Suporte a centenas de imagens simultâneas.
- Thumbnails baseados na CDN da DigitalOcean.

### B. Varredura (Passo 1)
- Grid interativo rápido.
- **Modo Palco (Stage Mode)**: Visualização full-screen com atalhos de teclado (V = Vibra, N = Não, Setas = Navegar).
- Salvamento obrigatório em uma nova "Varredura".

### C. Sinais (Passo 2)
- Localizado em `/app/dashboard/project/[id]/signals`.
- Exige a seleção de uma Varredura existente antes de começar.
- *Nota: A interface de tagging está em transição do diretório `tagging` para `signals`.*

### D. Ressonância (Agrupamento)
- Motor de clusterização hierárquica implementado.
- Gera clusters baseados nos vetores de sinais.

## 6. Próximos Passos Recomendados
1. **Consolidar Interface de Sinais**: Implementar a atribuição de tags dentro da nova rota `/signals` que agora recebe uma Varredura completa.
2. **Visualização de Clusters**: Refinar como os clusters são exibidos na página de Ressonância (atualmente é uma visualização básica de cards).
3. **IA Integration**: Finalizar a ponte com LLM para sugerir tags automaticamente baseadas no conteúdo da imagem (Passo 3 do `VIBE ENGINE.md`).
4. **Limites e Condensação**: Implementar os Passos 6 e 7 do método (Definição de anti-regras e criação do Card de Vibe).

---
**Dica de Debug:** Se encontrar problemas com exclusão de registros, verifique as FK constraints em `supabase/migrations/20240114000006_fix_user_delete_cascade.sql` e `20240115000002_fix_project_delete_cascade.sql`.

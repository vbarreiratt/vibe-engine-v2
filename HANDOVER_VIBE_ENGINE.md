# 🧭 HANDOVER VIBE ENGINE

> **Data do Handover**: 15/01/2026
> **Responsável**: Agente Antigravity (Google DeepMind)
> **Versão**: 0.1.0 (MVP Estável)

Este documento é a fonte única de verdade sobre o estado atual do projeto Vibe Engine. Ele descreve a arquitetura, as decisões metodológicas e o estágio de desenvolvimento para orientar o próximo ciclo de trabalho.

---

## 1️⃣ Visão Geral do Projeto

**O que é**: O Vibe Engine é uma plataforma de **curadoria assistida por IA e análise de ressonância**. Ele não é um gerador de moodboards nem um Pinterest. Ele é um **processador de sinais** que identifica padrões latentes em grandes conjuntos de imagens.

**Problema**: Curadores humanos sofrem para encontrar conexões invisíveis ("vibes") em milhares de imagens de forma objetiva.
**Princípio Central**: **Vibe ≠ Estética**. Vibe é um sistema de sinais recorrentes (padrões semânticos, cromáticos e de composição). O sistema existe para revelar a estrutura, não para impor um estilo.

---

## 2️⃣ Estado Atual do Sistema (Snapshot Honesto)

### ✅ ESTÁVEL (Funcional e Confiável)
*   **Pipeline de Ingestão**: Upload -> Captioning (Vertex AI) -> Embedding -> Graph (Graphology) -> Clustering (Louvain).
*   **Canvas de Ressonância**: Renderização de milhares de nodes com performance aceitável.
*   **Modos de Visualização**:
    *   **View Mode**: Navegação passiva.
    *   **Playground Mode**: Estado local de "rascunho" (Draft) persistido no navegador.
    *   **Snapshot System**: Versionamento de leituras (salva estado completo de nodes + clusters para histórico).
*   **Layout Dinâmico**: Os clusters agora se auto-organizam em formato circular expansivo ("borda interna do campo de força") para evitar empilhamento.
*   **Infraestrutura**: Dockerfile otimizado (standalone) e docker-compose prontos para deploy.

### 🟡 PARCIAL (Em Evolução / Ajuste)
*   **Fusão de Clusters ("Bubble Fusion")**: A lógica visual de arrastar uma bolha para outra funciona e o backend processa, mas a experiência de feedback visual ainda pode ser refinada.
*   **Editor de Cluster V1**: Permite ver sinais e "promover" termos, mas essas ações ainda têm impacto limitado no reprocessamento do grafo global. É mais uma anotação do que uma reestruturação profunda.
*   **Delete/Detach**: Funciona, mas depende de criar "bolhas de ruído" temporárias que precisam de limpeza posterior se abandonadas.

### 🔴 NÃO EXISTE AINDA (Dívida de Produto)
*   **Camada de Síntese**: Não existe interface para nomear a vibe final, definir seu arquétipo ou exportar o "Book de Vibe".
*   **Regeneração do Motor**: As edições no Canvas (Playground) não ensinam o motor a gerar clusters melhores no futuro.
*   **Conexões Semânticas**: Não há visualização de arestas ou pontes entre clusters vizinhos.

---

## 3️⃣ Arquitetura Conceitual (As 3 Camadas)

Entender isso é vital para não quebrar a lógica do sistema.

### 🔹 Camada 1: O Motor (Server-Side / Imutável no Run)
*   **O que faz**: Processa imagens, gera grafo, detecta comunidades (clusters matemáticos).
*   **Regra de Ouro**: O resultado do motor (Base State) é a "verdade matemática". Ele não muda durante uma sessão de edição. As edições do usuário são *deltas* sobre essa base.

### 🔹 Camada 2: A Leitura (Client-Side / Draft State)
*   **O que faz**: É o "Playground". Onde o curador arrasta, junta, separa e anota.
*   **Conceito**: É uma ferramenta de **intuição**. O usuário está testando hipóteses ("E se essa imagem for desse grupo?").
*   **Técnica**: Tudo roda em memória (`draftNodes`) e LocalStorage. Só vira "verdade" quando salvo como **Snapshot**.

### 🔹 Camada 3: A Síntese (Futuro / Decision Layer)
*   **O que faz**: Transforma clusters validados em **Conceitos**.
*   **Status**: Inexistente. É o próximo grande passo.
*   **Diferença**: Cluster é estatística. Vibe (Síntese) é decisão cultural.

---

## 4️⃣ Fluxos do Usuário

### Fluxo Principal: Refinamento de Ressonância
1.  **Entrada**: Usuário carrega um Run. Vê o "Caos organizado" (Layout ForceAtlas2).
2.  **Exploração**: Clica em clusters para ver detalhes (Sinais, Layers).
3.  **Playground (Ação)**:
    *   Clica em "Entrar no Playground".
    *   O estado congela em um rascunho local.
    *   **Detach**: Arrasta uma imagem para fora -> Cria uma nova "Bolha" (Single-node cluster). O layout do cluster original se fecha (reorganiza).
    *   **Attach/Merge**: Arrasta uma bolha para cima de um cluster -> A bolha é absorvida. O cluster destino se expande circularmente.
4.  **Versionamento**:
    *   Clica em "Salvar Leitura".
    *   O sistema grava um Snapshot no banco (JSONB completo).
    *   Usuário pode navegar entre versões anteriores através do seletor no topo.

---

## 5️⃣ Decisões Metodológicas Importantes

1.  **Clusters ≠ Vibes**: O software não entrega a vibe pronta. Ele entrega o cluster (padrão). O curador *lê* a vibe a partir do cluster.
2.  **Imutabilidade da Base**: Nunca alteramos o grafo original (run data) diretamente. Sempre criamos versões/snapshots. Isso permite "voltar à verdade matemática" se o curador se perder na edição manual.
3.  **Layout Orgânico**: Não usamos grids rígidos. O layout circular/físico é intencional para manter a sensação de "fluidez" e "campo de força".

---

## 6️⃣ Problemas Conhecidos & Dívidas Técnicas

*   **Tipagem Estrita**: O projeto usa TypeScript em modo estrito. Atenção redobrada a payloads de Server Actions (ex: `forms`, `undefined` returns).
*   **Performance do Canvas**: Com >500 imagens, o canvas pode engasgar em máquinas fracas (renderização de DOM/Framer Motion). Futuro: Migrar para Canvas API ou WebGL se escalar muito.
*   **Snapshots Pesados**: Atualmente salvamos o grafo inteiro no JSON do snapshot. Se o grafo tiver 10k nós, isso vai explodir o banco. Futuro: Salvar apenas os *deltas* (diferenças) em relação ao Base State.

---

## 7️⃣ Próximo Passo Recomendado

🛑 **Não faça agora**: Refinar algoritmo de clusterização ou mudar bibliotecas de gráfico. O motor está "bom o suficiente" para o MVP.

🚀 **Foco do Próximo Agente**:
1.  **Implementar a Camada de Síntese**: Criar as telas e lógicas onde o curador transforma o Snapshot final (clusters editados) em um entregável (Nome da Vibe, Descrição, Moodboard final).
2.  **Deploy e Monitoramento**: Garantir que o Docker no VPS comporte a carga de memória do processamento de grafos.

---

## 8️⃣ Referências Obrigatórias

1.  **`VIBE ENGINE.md`**: A bíblia conceitual. Leia para entender a filosofia.
2.  **`plano.md`**: O roadmap original. Use para ver o que já foi ticado.
3.  **`dev-log.md`**: Histórico detalhado de decisões técnicas e "porquês".
4.  **`app/actions/cluster-editor.ts`**: O coração da lógica de edição (Server Actions).


Perfeito. Vou complementar o documento de handover com uma seção nova, focada exclusivamente em Deploy, Infraestrutura e Fluxo de Branches, e já endereçar explicitamente a instrução para o próximo agente criar a branch main-dev e respeitar o fluxo automático da deploy.

Abaixo está o conteúdo que você pode anexar diretamente ao HANDOVER_VIBE_ENGINE.md (ou substituir como Seção 9). O texto já está no tom correto de handover técnico.

⸻

9️⃣ Deploy, Infraestrutura & Fluxo de Branches (Estado Atual)

Esta seção complementa o handover com informações operacionais reais do servidor em produção, essenciais para continuidade segura do projeto.

⸻

🌐 Infraestrutura de Produção (Ativa)

Provider: Hostinger VPS
Configuração:
	•	4 vCPU
	•	16 GB RAM
	•	200 GB NVMe
	•	Ubuntu 24.04 LTS
	•	Docker + Docker Compose
	•	Nginx Proxy Manager (NPM) como reverse proxy e SSL

Domínio ativo:
	•	https://estudiobicho.cloud

⸻

🐳 Arquitetura de Containers
	•	O Vibe Engine roda como container único (vibe-engine)
	•	O proxy reverso roda em stack separada (npm-npm-1)
	•	Ambos estão conectados à mesma network Docker (npm_default)

Comunicação:
	•	NPM → http://vibe-engine:3000
	•	SSL é terminado no Nginx Proxy Manager
	•	Websockets habilitados

⸻

📦 Estrutura de Pastas no VPS

/home/vitor/apps/
├── vibe-engine-v2/          # Repositório clonado (branch deploy)
├── scripts/
│   └── deploy.sh            # Script de deploy automático
├── logs/
│   └── deploy.log           # Log de deploy via cron
└── secrets/
    └── vibe-engine-v2/
        ├── .env
        └── gcp-service-account.json

⚠️ Importante:
	•	.env não fica dentro do repo
	•	gcp-service-account.json não fica dentro do repo
	•	O repositório pode ser limpo (git clean -fd) sem risco

⸻

🔐 Variáveis de Ambiente (Produção)
	•	.env carregado via docker compose --env-file
	•	Variáveis NEXT_PUBLIC_* passam no build
	•	Variáveis sensíveis (SUPABASE_SERVICE_ROLE_KEY, GCP, OpenAI etc.) não são expostas no frontend

Validação já realizada:
	•	Nenhuma key sensível aparece no HTML ou JS público
	•	Apenas redirecionamento para /login é visível externamente

⸻

🚀 Deploy Automático (Ativo)

Existe um deploy automático via cron, que roda a cada minuto:

* * * * * /home/vitor/apps/scripts/deploy.sh >> /home/vitor/apps/logs/deploy.log 2>&1

Script deploy.sh (resumo lógico):
	1.	Vai para o repo
	2.	Limpa estado local
	3.	Faz git fetch origin deploy
	4.	Compara SHA local vs remoto
	5.	Se houver mudança:
	•	Checkout forçado da branch deploy
	•	docker compose down
	•	docker compose up -d --build

📌 Resultado:

Todo commit novo na branch deploy é automaticamente buildado e colocado em produção.

⸻

🌱 Fluxo de Branches (Obrigatório a partir de agora)

Este fluxo não pode ser quebrado:

Branches Oficiais
	•	deploy
	•	Conectada ao servidor
	•	Qualquer commit aqui → produção automática
	•	❌ Nunca desenvolver diretamente nela
	•	main-dev (NOVA – criar agora)
	•	Branch principal de desenvolvimento
	•	Onde novas features, fluxos e refactors devem acontecer
	•	Base para PRs futuros

Regra de Ouro

main-dev → (PR / cherry-pick) → deploy → produção


⸻

🔔 Instrução Direta ao Próximo Agente

Ao assumir o projeto:
	1.	Criar imediatamente a branch main-dev a partir de main
	2.	Trabalhar exclusivamente em main-dev
	3.	Nunca commitar direto em deploy
	4.	Apenas após validação manual, pedir autorização para promover mudanças de main-dev → deploy
	5.	Tratar o ambiente de produção como imutável e automatizado

⸻

🧠 Nota Metodológica Importante

O sistema está epistemologicamente estável:
	•	Motor (Camada 1) fechado
	•	Leitura (Camada 2) funcional
	•	Infra agora confiável

A partir deste ponto:

O risco não é técnico, é conceitual.

Toda feature nova deve respeitar:
	•	Imutabilidade do Run
	•	Separação entre leitura e síntese
	•	Versionamento consciente


---

## 🔐 Google Cloud Platform Credentials Setup

### Overview
The Vibe Engine uses Google Cloud Vertex AI for:
- Image captioning and analysis
- Text embeddings generation
- AI-powered signal extraction

**Critical**: All GCP authentication now uses environment variables - no hardcoded paths.

### Configuration

#### 1. Environment Variables

Required in `.env` file:

```bash
# GCP Project Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Path to service account JSON (inside container)
GOOGLE_CLOUD_CREDENTIALS_PATH=/app/gcp-service-account.json

# Docker Compose: Host path to service account file
GCP_SERVICE_ACCOUNT_FILE=/home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json
```

#### 2. Local Development

1. Obtain your GCP service account JSON from Google Cloud Console
2. Save it to a secure location (e.g., `~/secrets/gcp-service-account.json`)
3. Update `.env`:
   ```bash
   GOOGLE_CLOUD_CREDENTIALS_PATH=/absolute/path/to/your/service-account.json
   ```

#### 3. VPS/Docker Production Setup

**Directory Structure on VPS:**
```
/home/vitor/apps/secrets/vibe-engine-v2/
└── gcp-service-account.json
```

**Docker Compose automatically mounts:**
- Host: `/home/vitor/apps/secrets/vibe-engine-v2/gcp-service-account.json`
- Container: `/app/gcp-service-account.json`

**Verification Commands:**

```bash
# Check environment variable inside container
docker exec -it vibe-engine sh -c 'printenv | grep GOOGLE'

# Verify file exists inside container
docker exec -it vibe-engine sh -c 'ls -la /app/gcp-service-account.json'

# Should output: -r--r--r-- 1 root root <size> <date> /app/gcp-service-account.json
```

### Security Notes

1. **Never commit** `service-account.json` to version control
2. **File is mounted read-only** (`:ro`) in Docker for security
3. **Permissions**: Ensure the file is readable by the container user
4. **Secrets location on VPS**: `/home/vitor/apps/secrets/` is outside the app directory for isolation

### Troubleshooting

**Error: `ENOENT: no such file or directory`**
- Check `GOOGLE_CLOUD_CREDENTIALS_PATH` is set correctly
- Verify file exists at the specified path
- In Docker: ensure volume mount is configured

**Error: `Missing GOOGLE_CLOUD_CREDENTIALS_PATH`**
- Add the environment variable to `.env`
- Restart the container after updating `.env`

**Error: `Failed to read or parse credentials`**
- Verify JSON file is valid (use `cat <file> | jq` to validate)
- Check file permissions (must be readable)

### Implementation Details

**Helper Module**: `lib/ai/google/credentials.ts`
- `getGoogleCredentialsPath()`: Resolves and validates credentials path
- `loadGoogleCredentials()`: Loads and parses the JSON file

**Used by:**
- `lib/ai/embedding.ts`: Text embeddings via Vertex AI
- `app/ferramentas/vibe-engine/dashboard/project/[id]/signals/ai-actions.ts`: Image analysis

---

# Relatório Cognitivo de Clusterização (Vibe Engine)

**Run ID:** `unknown`
**Data:** 2026-01-14T23:45:27.710Z
**Input:** 50 imagens processadas via text-embedding-004 (768d).

## 1. Preparação e Normalização (Amostra)
Exibindo primeiros 3 exemplos de transformação texto -> canônico:

### Imagem `29c4cb5d-1832-45e3-8434-5d619b3c2c72`
- **Original**: S=[impactante, preciso, moderno] M=[espaço, vetor, silhueta] V=[expansão, centralização, definição]
- **Canônico**: "state: impactante, preciso, moderno | matter: espaço, vetor, silhueta | movement: expansão, centralização, definição"

### Imagem `df9dcc5e-e809-4ffe-933a-8d6772a72800`
- **Original**: S=[provocante, intenso, agressivo] M=[vinil, tinta fresca, ruído digital] V=[sorrir, fixar, apontar]
- **Canônico**: "state: provocante, intenso, agressivo | matter: vinil, tinta fresca, ruído digital | movement: sorrir, fixar, apontar"

### Imagem `b8ace381-cb66-4aa2-b93b-51f1386e7c5f`
- **Original**: S=[ousado, moderno, declarativo] M=[acrílico, metal escovado, papel grosso] V=[ancorar, definir, moldar]
- **Canônico**: "state: ousado, moderno, declarativo | matter: acrílico, metal escovado, papel grosso | movement: ancorar, definir, moldar"

## 2. Decisões de Grafo (Arestas)
Total de conexões avaliadas relevantes: 944

### Top 5 Conexões Mais Fortes
- **6db3da82-b45f-40f0-a543-3f1937a9b77d ↔ 0c5c54c4-92bf-4d2b-8e84-833bcc4c4de4** (Score: 0.812)
  - Shared Signals: state:melancólico, mov:sussurrar
- **0ebe866b-c55b-4e71-bcde-e5fcd7284fb9 ↔ 9bb8de15-9509-476d-bfe3-07958868bd36** (Score: 0.788)
  - Shared Signals: matter:luz neon, mov:pulsar
- **df9dcc5e-e809-4ffe-933a-8d6772a72800 ↔ 7218cf32-626d-4a24-8724-b242e7b15201** (Score: 0.784)
  - Shared Signals: state:agressivo, matter:ruído digital
- **761e88eb-94c6-4af5-a0fc-f2e54de1a128 ↔ 5ad46f54-a6e1-41cd-bef0-7b13fefd400b** (Score: 0.780)
  - Shared Signals: state:organizado, matter:plástico, matter:papel
- **c3cd49f1-d0e2-478b-ab04-8e079f1b513b ↔ f9102c9f-704c-4773-864b-f499ce9cef6e** (Score: 0.773)
  - Shared Signals: state:energético, mov:pulsa

## 3. Explicação dos Clusters
Método: Louvain Modularity + ForceAtlas2. Resultado: 22 clusters.

### Clusters Fortes (Vibes Consolidadas)
**[Cluster 3]** (Força: 0.94, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=67%, Matéria=33%, Movimento=67%
  - Sinais Dominantes: energético / plástico / saltar
- **Interpretação**: Cluster STRONG (94%). Vibe consolidada. Recorrência alta em múltiplos canais.

### Proto-Clusters (Mundos Emergentes)
**[Cluster 1]** (Força: 0.91, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=57%, Matéria=43%, Movimento=43%
  - Sinais Dominantes: caótico / papel / sobrepor
- **Interpretação**: Cluster PROTO (91%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 2]** (Força: 0.95, Estabilidade: 0.67, Densidade: 0.75)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=67%, Matéria=67%, Movimento=67%
  - Sinais Dominantes: formal / papel / ancorar
- **Interpretação**: Cluster PROTO (95%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 4]** (Força: 1.00, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=29%, Matéria=43%, Movimento=86%
  - Sinais Dominantes: energético / luz neon / pulsar
- **Interpretação**: Cluster PROTO (100%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 10]** (Força: 0.75, Estabilidade: 0.20, Densidade: 0.75)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: analítico / dados / processando
- **Interpretação**: Cluster PROTO (75%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 11]** (Força: 1.00, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=33%, Matéria=100%, Movimento=33%
  - Sinais Dominantes: digital / plástico / organizando
- **Interpretação**: Cluster PROTO (100%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 12]** (Força: 0.81, Estabilidade: 0.50, Densidade: 0.81)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=50%, Movimento=100%
  - Sinais Dominantes: melancólico / veludo / sussurrar
- **Interpretação**: Cluster PROTO (81%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 13]** (Força: 0.76, Estabilidade: 0.20, Densidade: 0.76)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=50%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: desorientador / glitch / corrompendo
- **Interpretação**: Cluster PROTO (76%). Mundo emergente. Forte conexão mas tamanho reduzido.

**[Cluster 15]** (Força: 0.70, Estabilidade: 0.20, Densidade: 0.70)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=50%, Movimento=50%
  - Sinais Dominantes: fragmentado / vidro quebrado / girando
- **Interpretação**: Cluster PROTO (70%). Mundo emergente. Forte conexão mas tamanho reduzido.

### Ruído / Outliers
**[Cluster 0]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: impactante / espaço / expansão
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 5]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: alegre / açúcar / correr
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 6]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: lúdico / feltro macio / saltitar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 7]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: noite urbana / metal / iluminar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 8]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: digital / neon glow / pulsante
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 9]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: intenso / digital light / fading
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 14]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: lúdico / holográfico / cintilar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 16]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: descolado / tinta / anunciar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 17]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: estático / pixels / exibir
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 18]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: impactante / tinta densa / escalar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 19]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: vibrante / grão dourado / pulsar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 20]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: digital / pixels / escanear
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.

**[Cluster 21]** (Força: 0.00, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: evocativo / luz / flutuar
- **Interpretação**: Cluster NOISE (0%). Isolado ou conexão fraca irrelevante.


### Auditoria e Evidências
Para garantir a rastreabilidade deste processo (Chain of Evidence), consulte os artefatos:
- **Cálculos Detalhados**: `evidence/cluster_metrics.json`
- **Atribuições**: `evidence/cluster_assignments.csv`
- **Arestas Auditadas**: `evidence/graph_edges.csv`
- **Inputs Canônicos**: `evidence/inputs_canonical.csv`

> _Relatório gerado automaticamente pelo Vibe Engine v2 (Audit Mode)._

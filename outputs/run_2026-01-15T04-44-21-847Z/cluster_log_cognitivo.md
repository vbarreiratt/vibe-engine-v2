# Relatório Cognitivo de Clusterização (Vibe Engine)

**Run ID:** `unknown`
**Data:** 2026-01-15T04:44:01.995Z
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
Total de conexões avaliadas relevantes: 958

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
Método: Louvain Modularity + ForceAtlas2. Resultado: 17 clusters.

### Clusters Fortes (Vibes Consolidadas)
**[Cluster 4]** (Força: 0.65, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=22%, Matéria=44%, Movimento=78%
  - Sinais Dominantes: energético / luz neon / pulsar
- **Interpretação**: Cluster STRONG (65%). Vibe forte. Recorrência multi-camada (61%) e densidade alta.

**[Cluster 10]** (Força: 0.67, Estabilidade: 1.00, Densidade: 0.73)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=43%, Matéria=86%, Movimento=29%
  - Sinais Dominantes: informativo / plástico / organizando
- **Interpretação**: Cluster STRONG (67%). Vibe forte. Recorrência multi-camada (64%) e densidade alta.

### Proto-Clusters (Mundos Emergentes)
**[Cluster 2]** (Força: 0.69, Estabilidade: 0.67, Densidade: 0.75)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=67%, Matéria=67%, Movimento=67%
  - Sinais Dominantes: formal / papel / ancorar
- **Interpretação**: Cluster PROTO (69%). Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.

**[Cluster 9]** (Força: 0.69, Estabilidade: 0.33, Densidade: 0.75)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=67%, Matéria=67%, Movimento=67%
  - Sinais Dominantes: analítico / dados / processando
- **Interpretação**: Cluster PROTO (69%). Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.

**[Cluster 11]** (Força: 0.94, Estabilidade: 0.50, Densidade: 0.81)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=50%, Movimento=100%
  - Sinais Dominantes: melancólico / veludo / sussurrar
- **Interpretação**: Cluster PROTO (94%). Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.

**[Cluster 12]** (Força: 0.93, Estabilidade: 0.20, Densidade: 0.76)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=50%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: desorientador / glitch / corrompendo
- **Interpretação**: Cluster PROTO (93%). Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.

**[Cluster 14]** (Força: 0.74, Estabilidade: 0.20, Densidade: 0.70)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=50%, Movimento=50%
  - Sinais Dominantes: fragmentado / vidro quebrado / girando
- **Interpretação**: Cluster PROTO (74%). Núcleo em formação. Sinais fortes, mas quantidade/densidade abaixo do limiar.

### Clusters Fracos (Limítrofes)
**[Cluster 1]** (Força: 0.57, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=57%, Matéria=43%, Movimento=43%
  - Sinais Dominantes: caótico / papel / sobrepor
- **Interpretação**: Cluster WEAK (57%). Vibe fraca. Sinais dispersos (Recorrência < 60%). Requer curadoria.

**[Cluster 3]** (Força: 0.62, Estabilidade: 1.00, Densidade: 0.74)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=57%, Matéria=29%, Movimento=57%
  - Sinais Dominantes: energético / plástico / saltar
- **Interpretação**: Cluster WEAK (62%). Vibe fraca. Sinais dispersos (Recorrência < 60%). Requer curadoria.

### Ruído / Outliers
**[Cluster 0]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: impactante / espaço / expansão
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 5]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: alegre / açúcar / correr
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 6]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: lúdico / feltro macio / saltitar
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 7]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: digital / luz neon / pulsante
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 8]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: intenso / luz digital / desvanecer
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 13]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: lúdico / holográfico / cintilar
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 15]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: estático / pixels / exibir
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.

**[Cluster 16]** (Força: 0.70, Estabilidade: 0.00, Densidade: 0.00)
- **Cadeia de Formação**:
  - Sinais Recorrentes: Estado=100%, Matéria=100%, Movimento=100%
  - Sinais Dominantes: evocativo / luz / flutuar
- **Interpretação**: Cluster NOISE (70%). Descartado. Tamanho insuficiente ou arestas fracas.


### Auditoria e Evidências
Para garantir a rastreabilidade deste processo (Chain of Evidence), consulte os artefatos:
- **Cálculos Detalhados**: `evidence/cluster_metrics.json`
- **Atribuições**: `evidence/cluster_assignments.csv`
- **Arestas Auditadas**: `evidence/graph_edges.csv`
- **Inputs Canônicos**: `evidence/inputs_canonical.csv`

> _Relatório gerado automaticamente pelo Vibe Engine v2 (Audit Mode)._

# Relatório Cognitivo de Clusterização (Vibe Engine)

**Run ID:** `unknown`
**Data:** 2026-01-14T23:19:59.818Z
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
Total de conexões avaliadas relevantes: 908

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
Método: Louvain Modularity + ForceAtlas2. Resultado: 25 clusters.

### Cluster 0
- **Medoid (Núcleo)**: `29c4cb5d-1832-45e3-8434-5d619b3c2c72`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: impactante, preciso, moderno
  - Matéria: espaço, vetor, silhueta
  - Movimento: expansão, centralização, definição
- **Justificativa**: Cluster consolidado em torno de impactante + espaço. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 1
- **Medoid (Núcleo)**: `5401cb7c-08da-446a-b4c1-40989be206ca`
- **Tamanho**: 5 imagens
- **Sinais Dominantes**:
  - Estado: caótico, agressivo, fragmentado
  - Matéria: tinta fresca, ruído digital, papel rasgado
  - Movimento: sobrepor, sorrir, fixar
- **Justificativa**: Cluster consolidado em torno de caótico + tinta fresca. Alta densidade de arestas (6) sugerindo coesão forte.

### Cluster 2
- **Medoid (Núcleo)**: `b8ace381-cb66-4aa2-b93b-51f1386e7c5f`
- **Tamanho**: 2 imagens
- **Sinais Dominantes**:
  - Estado: ousado, moderno, declarativo
  - Matéria: acrílico, metal escovado, papel grosso
  - Movimento: ancorar, definir, moldar
- **Justificativa**: Cluster consolidado em torno de ousado + acrílico. Alta densidade de arestas (1) sugerindo coesão forte.

### Cluster 3
- **Medoid (Núcleo)**: `0c7401e0-31ff-414b-a1a5-37788125a8d4`
- **Tamanho**: 6 imagens
- **Sinais Dominantes**:
  - Estado: energético, enigmático, ousado
  - Matéria: plástico, tinta vibrante, plástico liso
  - Movimento: saltar, chamar, declarar
- **Justificativa**: Cluster consolidado em torno de energético + plástico. Alta densidade de arestas (8) sugerindo coesão forte.

### Cluster 4
- **Medoid (Núcleo)**: `0ebe866b-c55b-4e71-bcde-e5fcd7284fb9`
- **Tamanho**: 7 imagens
- **Sinais Dominantes**:
  - Estado: energético, urgente, urbano
  - Matéria: luz neon, neon, pixels
  - Movimento: pulsar, fragmentar, oscilar
- **Justificativa**: Cluster consolidado em torno de energético + luz neon. Alta densidade de arestas (7) sugerindo coesão forte.

### Cluster 5
- **Medoid (Núcleo)**: `559edd31-01ed-47f0-a5f2-a20b4c07cdde`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: alegre, acolhedor, simples
  - Matéria: açúcar, algodão, calor
  - Movimento: correr, acender, oferecer
- **Justificativa**: Cluster consolidado em torno de alegre + açúcar. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 6
- **Medoid (Núcleo)**: `96203f8c-e3e8-4966-9c3d-f7ac9168f992`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: lúdico, acolhedor, gentil
  - Matéria: feltro macio, borracha, massa de modelar
  - Movimento: saltitar, flutuar, acolher
- **Justificativa**: Cluster consolidado em torno de lúdico + feltro macio. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 7
- **Medoid (Núcleo)**: `eb61265a-fc7c-4f4f-89b7-ce94f8a7b8e5`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: noite urbana, caótica, vibrante
  - Matéria: metal, chuva, luz neon
  - Movimento: iluminar, desfocar, sobrepor
- **Justificativa**: Cluster consolidado em torno de noite urbana + metal. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 8
- **Medoid (Núcleo)**: `a462e427-6593-4b04-8909-07003b8a76e9`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: digital, energetic, informational
  - Matéria: neon glow, digital grid, bold typography
  - Movimento: pulsating, scrolling, aligning
- **Justificativa**: Cluster consolidado em torno de digital + neon glow. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 9
- **Medoid (Núcleo)**: `68830f51-7115-4dde-ac53-f6d8be34de1b`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: intense, abstract, minimalist
  - Matéria: digital light, static energy, processed air
  - Movimento: fading, shimmering, pulsing
- **Justificativa**: Cluster consolidado em torno de intense + digital light. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 10
- **Medoid (Núcleo)**: `7d372b41-9eec-48d5-97fd-28c556d7475a`
- **Tamanho**: 2 imagens
- **Sinais Dominantes**:
  - Estado: analítico, digital, texturizado
  - Matéria: dados, pixel, caracteres
  - Movimento: processando, renderizando, desenhando
- **Justificativa**: Cluster consolidado em torno de analítico + dados. Alta densidade de arestas (1) sugerindo coesão forte.

### Cluster 11
- **Medoid (Núcleo)**: `9836cde7-2b04-410a-bbe8-5ddba64d38b7`
- **Tamanho**: 6 imagens
- **Sinais Dominantes**:
  - Estado: digital, informativo, organizado
  - Matéria: plástico, papel, luz difusa
  - Movimento: organizando, difundindo, desdobrando
- **Justificativa**: Cluster consolidado em torno de digital + plástico. Alta densidade de arestas (6) sugerindo coesão forte.

### Cluster 12
- **Medoid (Núcleo)**: `6db3da82-b45f-40f0-a543-3f1937a9b77d`
- **Tamanho**: 2 imagens
- **Sinais Dominantes**:
  - Estado: melancólico, introspectivo, sensual
  - Matéria: veludo, pétala, sombra
  - Movimento: sussurrar, desabrochar, contemplar
- **Justificativa**: Cluster consolidado em torno de melancólico + veludo. Alta densidade de arestas (1) sugerindo coesão forte.

### Cluster 13
- **Medoid (Núcleo)**: `b94dea90-0a9d-4b59-9fbc-535749306fd2`
- **Tamanho**: 2 imagens
- **Sinais Dominantes**:
  - Estado: desorientador, digitalmente fragmentado, nostálgico confuso
  - Matéria: glitch, pixels, pelo digital
  - Movimento: corrompendo, fragmentando, pixelizando
- **Justificativa**: Cluster consolidado em torno de desorientador + glitch. Alta densidade de arestas (1) sugerindo coesão forte.

### Cluster 14
- **Medoid (Núcleo)**: `c374c250-2e51-4b59-906d-3bd36e009aa8`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: lúdico, brilhante, descolado
  - Matéria: holográfico, prateado, iridescente
  - Movimento: cintilar, ondular, brilhar
- **Justificativa**: Cluster consolidado em torno de lúdico + holográfico. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 15
- **Medoid (Núcleo)**: `009e1ba9-0676-4a07-99df-cbb5564f3c57`
- **Tamanho**: 2 imagens
- **Sinais Dominantes**:
  - Estado: fragmentado, caótico, vertiginoso
  - Matéria: vidro quebrado, energia vibrante, metais frios
  - Movimento: girando, pulsando, rasgando
- **Justificativa**: Cluster consolidado em torno de fragmentado + vidro quebrado. Alta densidade de arestas (1) sugerindo coesão forte.

### Cluster 16
- **Medoid (Núcleo)**: `a78037ec-26b1-4540-a7c6-afe34f390975`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: descolado, informativo, descontraído
  - Matéria: tinta, papel, energia
  - Movimento: anunciar, desdobrar, informar
- **Justificativa**: Cluster consolidado em torno de descolado + tinta. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 17
- **Medoid (Núcleo)**: `5e238faf-b677-483a-8b3a-e1c4fcf6479f`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: intenso, confrontador, declarativo
  - Matéria: tinta, papel, impacto
  - Movimento: chocar, impor, revelar
- **Justificativa**: Cluster consolidado em torno de intenso + tinta. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 18
- **Medoid (Núcleo)**: `27891bd3-a828-45a4-bf5a-6b7a8105565c`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: estático, técnico, informativo
  - Matéria: pixels, dados, sinais
  - Movimento: exibir, registrar, processar
- **Justificativa**: Cluster consolidado em torno de estático + pixels. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 19
- **Medoid (Núcleo)**: `291bb266-687f-4ca1-a7da-e45c010d7790`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: intense, vibrant, chaotic
  - Matéria: ink, paper, ink stain
  - Movimento: staring, pulsing, layering
- **Justificativa**: Cluster consolidado em torno de intense + ink. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 20
- **Medoid (Núcleo)**: `71ce5603-a6ce-4357-9eeb-26d9b70a8e24`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: impactante, desafiador, abstrato
  - Matéria: tinta densa, espaço negativo, contorno
  - Movimento: escalar, interligar, contornar
- **Justificativa**: Cluster consolidado em torno de impactante + tinta densa. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 21
- **Medoid (Núcleo)**: `580216a0-1ede-4f95-9213-f9b16ceb6e0f`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: formal, declarative, organized
  - Matéria: ink, paper, digital
  - Movimento: imposing, labeling, cataloging
- **Justificativa**: Cluster consolidado em torno de formal + ink. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 22
- **Medoid (Núcleo)**: `3a1a67ed-71b8-483d-bc7f-611710594bba`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: vibrante, informativo, cultural
  - Matéria: grão dourado, tinta fosca, papel texturizado
  - Movimento: pulsar, fluir, circular
- **Justificativa**: Cluster consolidado em torno de vibrante + grão dourado. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 23
- **Medoid (Núcleo)**: `129f7722-1cbb-47a7-933c-f53e2380b00a`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: digital, futurista, funcional
  - Matéria: pixels, papel, circuito
  - Movimento: escanear, processar, deslizar
- **Justificativa**: Cluster consolidado em torno de digital + pixels. Alta densidade de arestas (0) sugerindo coesão forte.

### Cluster 24
- **Medoid (Núcleo)**: `81b7ffce-c586-4e5a-ae1d-7ce76356a1fd`
- **Tamanho**: 1 imagens
- **Sinais Dominantes**:
  - Estado: evocativo, refinado, moderno
  - Matéria: luz, design, elegância
  - Movimento: flutuar, surgir, revelar
- **Justificativa**: Cluster consolidado em torno de evocativo + luz. Alta densidade de arestas (0) sugerindo coesão forte.


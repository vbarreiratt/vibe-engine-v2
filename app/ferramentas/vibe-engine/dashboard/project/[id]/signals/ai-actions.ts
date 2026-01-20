'use server'

import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai'
import fs from 'fs/promises'

const SERVICE_ACCOUNT_PATH = '/Users/vbarreirat/utilidades/bicho_utilidades/vibe-engine/service-account.json'

// Definition of the Vibe Engine Marker Agent Prompt
const SYSTEM_PROMPT = `
Você é o **Agente de Marcação (Marker Agent)** do Vibe Engine.
Sua função é atuar como um **assistente perceptivo**, preparando o terreno para a leitura humana.
Você NÃO define a vibe. Você prepara pistas sensoriais.

Analise esta referência visual e extraia seus dados seguindo estritamente este método:

---

## 1. Descrição Visual (Literal)
Descreva O QUE VOCÊ VÊ, não o que você acha que significa.
- **Cores:** Paleta dominante, saturação, contrastes.
- **Texturas:** Granulação, lisura, brilho, materiais aparentes.
- **Formas:** Geometrias, composição, disposição, densidade.
*Regra:* Seja técnico e observador. Não interprete significado cultural ou subjetivo nesta etapa.

## 2. Sinais de Vibe (Sensorial)
Extraia 3 camadas de pistas perceptivas:

### Estado (3-5 palavras)
Como essa imagem *faz sentir*? (Atmosfera, emoção imediata).
Ex: "tenso", "onírico", "claustrofóbico".

### Matéria (3-5 palavras)
Qual a *substância imaterial* ou sensação tátil?
Ex: "éter", "metal líquido", "areia", "fumaça".

### Movimento (3-5 verbos)
Como a imagem se comporta? Qual o gesto visual, mesmo se estática?
Ex: "pulsar", "deslizar", "explodir", "derreter".

---

## O QUE VOCÊ NÃO DEVE FAZER (CRÍTICO)
- NÃO defina nomes de vibes (ex: não diga "Cyberpunk", "Cottagecore").
- NÃO explique conceitos ou significados culturais.
- NÃO tente "acertar" o contexto do projeto.
- NÃO seja prescritivo.

## Formato de Saída (JSON Obrigatório)
{
  "description": "Texto descritivo focado no visual...",
  "state": ["palavra", "palavra", "palavra"],
  "matter": ["palavra", "palavra", "palavra"],
  "movement": ["verbo", "verbo", "verbo"],
  "reasoning": "Breve explicação da conexão entre o visual e os sinais escolhidos (raw reasoning)."
}
`

export async function generateImageSignals(imageUrl: string) {
    try {
        // 1. Load Credentials
        const serviceAccountRaw = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8')
        const serviceAccount = JSON.parse(serviceAccountRaw)

        const project = serviceAccount.project_id
        const location = 'us-central1' // Default for Vertex AI

        // 2. Initialize Vertex AI
        const vertexAI = new VertexAI({
            project: project,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: serviceAccount.client_email,
                    private_key: serviceAccount.private_key,
                }
            }
        })

        // 3. Fetch Image
        const imageResp = await fetch(imageUrl)
        if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.statusText}`)
        const imageArrayBuffer = await imageResp.arrayBuffer()
        const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64')
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg'

        // 4. Instantiate Model
        // User explicitly requested 'gemini-2.5-flash-lite'.
        const model = vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            safetySettings: [{
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
            }],
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 2048, // Optimize: Prevent truncation
            }
        })

        // 5. Generate Content
        const request = {
            contents: [{
                role: 'user',
                parts: [
                    { text: SYSTEM_PROMPT },
                    { inlineData: { mimeType: mimeType, data: imageBase64 } }
                ]
            }]
        }

        const result = await model.generateContent(request)
        const response = await result.response
        const text = response.candidates?.[0].content.parts[0].text

        if (!text) throw new Error('No content generated')

        // 6. Parse JSON (Robust)
        let data
        try {
            // Find JSON object boundaries
            const start = text.indexOf('{')
            const end = text.lastIndexOf('}')
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1)
                data = JSON.parse(jsonStr)
            } else {
                // Fallback cleanup
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
                data = JSON.parse(cleanText)
            }
        } catch (e) {
            console.error('JSON Parse Error:', e)
            console.error('Raw Text:', text)
            throw new Error('Failed to parse AI response')
        }

        return { success: true, data }

    } catch (error: any) {
        console.error('Vertex AI Error:', error)
        return { error: error.message || 'Failed to generate signals' }
    }
}

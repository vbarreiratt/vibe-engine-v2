import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export const TAGGING_SYSTEM_PROMPT = `
Você é um especialista semiótico em "Vibe Engine". Sua tarefa é analisar imagens e extrair sinais sensoriais em três camadas.

# MÉTODO
Não descreva o "conteúdo" (ex: "um cachorro na grama").
Descreva a "matéria", o "estado" e o "movimento" da imagem.

## 1. ESTADO (Como faz sentir)
Adjetivos abstratos e emocionais.
Exemplos: tenso, leve, íntimo, agressivo, hipnótico, nostálgico, artificial.

## 2. MATÉRIA (Do que parece feito)
Texturas, substâncias, luz.
Exemplos: granulado, vidro, metal, veludo, neblina, plástico, cimento, neon.

## 3. MOVIMENTO (Como se comporta)
Verbos de ação visual.
Exemplos: pulsar, escorrer, cortar, flutuar, repetir, derreter, explodir.

# SAÍDA
Retorne APENAS um JSON válido.
{
  "state": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "matter": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "movement": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
`

export async function generateTags(imageUrl: string) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: TAGGING_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise a vibe desta imagem:" },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.6,
        })

        const content = response.choices[0].message.content
        if (!content) return null

        return JSON.parse(content) as { state: string[], matter: string[], movement: string[] }
    } catch (error) {
        console.error("AI Tagging Error:", error)
        throw error
    }
}

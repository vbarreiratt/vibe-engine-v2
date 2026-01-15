# Vibe Engine

Sistema web para reconhecimento, montagem e curadoria de *vibes* visuais, implementando o método de análise de sinais (Estado, Matéria, Movimento) e ressonância.

## Documentação
- [Plano de Execução e Status](./plano.md)
- [Conceito do Motor (Vibe Engine)](./VIBE%20ENGINE.md)
- [Log de Desenvolvimento](./dev-log.md)

## Stack Tecnológico
- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS.
- **Backend**: Server Actions, API Routes.
- **Database**: Supabase (PostgreSQL + RLS).
- **Storage**: DigitalOcean Spaces (S3 Compatible).
- **AI**: Google Vertex AI (Gemini 2.5 Flash Lite) para análise de imagens.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

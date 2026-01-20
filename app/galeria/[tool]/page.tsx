// app/galeria/[tool]/page.tsx
// Página de apresentação de cada ferramenta - Design atualizado (node-id: 47:77)

import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'

const tools = {
  'vibe-engine': {
    id: 'vibe-engine',
    name: 'Vibe Engine',
    version: 'V 1.0 Alpha',
    accessUrl: '/ferramentas/vibe-engine'
  }
  // Futuras ferramentas...
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: toolId } = await params
  const tool = tools[toolId as keyof typeof tools]

  if (!tool) {
    notFound()
  }

  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex flex-col items-center justify-center px-6 py-12 gap-6">
      {/* Logo pequeno no topo */}
      <div className="w-full max-w-[1400px]">
        <div className="relative w-[216px] h-[71px]">
          <Image
            src="/bicho-outline.svg"
            alt="bicho"
            fill
            className="object-contain object-left"
            draggable={false}
          />
        </div>
      </div>

      {/* Card verde com conteúdo */}
      <div className="relative w-full max-w-[1200px]">
        {/* Background do card (folha verde) */}
        <div className="relative w-full h-[800px]">
          <Image
            src="/card-green.svg"
            alt="Card"
            fill
            className="object-contain"
            draggable={false}
          />
        </div>

        {/* Logo Vibe Engine dentro do card */}
        <div className="absolute top-[90px] left-[120px] w-[600px] h-[90px]">
          <Image
            src="/vibe-engine-outline.svg"
            alt="Vibe Engine"
            fill
            className="object-contain object-left"
            draggable={false}
          />
        </div>

        {/* Texto em duas colunas */}
        <div className="absolute top-[230px] left-[120px] right-[120px] flex flex-col md:flex-row gap-8">
          {/* Coluna 1 */}
          <div
            className="flex-1 text-[22px] text-black text-justify leading-relaxed"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
          >
            <p className="mb-6">
              Sabe quando você junta referências e percebe que algumas compartilham algo que você não sabe nomear? Não é o assunto, não é a paleta, não é o local, é um parentesco invisível.
            </p>
            <p>
              Essa ferramenta ajuda a dar contorno a essas atmosferas. Ela lê sinais de como as imagens fazem sentir, do que parecem feitas e como se comportam, e organiza o que vibra junto em grupos reconhecíveis.
            </p>
          </div>

          {/* Coluna 2 */}
          <div
            className="flex-1 text-[22px] text-black text-justify leading-relaxed"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
          >
            <p className="mb-6">
              A ferramenta potencializa seu olhar, não o substitui. Você marca percepções honestas, ela mapeia ressonâncias. Você decide o que é uma vibe, o que se funde, o que se descarta. O trabalho sensível, cultural e artístico continua sendo seu, a Engine só ajuda a dar norte.
            </p>
            <p>
              O critério de sucesso: "não sei explicar, mas entendi".
            </p>
          </div>
        </div>

        {/* Versão (inferior esquerdo) */}
        <p
          className="absolute bottom-[80px] left-[120px] text-[14px] text-black"
          style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
        >
          {tool.version}
        </p>

        {/* Botão [acessar] (inferior direito) */}
        <Link
          href={tool.accessUrl}
          className="absolute bottom-[150px] right-[200px] text-[24px] text-black hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 700 }}
        >
          [acessar]
        </Link>
      </div>

      {/* Link [Voltar] */}
      <div className="w-full max-w-[1400px]">
        <Link
          href="/galeria"
          className="text-black text-[18px] hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 700 }}
        >
          [Voltar]
        </Link>
      </div>
    </main>
  )
}

// app/galeria/page.tsx
// Galeria de ferramentas - Design atualizado (node-id: 55:292)

import Link from 'next/link'
import Image from 'next/image'

const tools = [
  {
    id: 'vibe-engine',
    name: 'Vibe Engine',
    version: 'V 1.0 Alpha',
    description: 'Essa ferramenta ajuda a ler sinais de como diferentes referências fazem sentir, parecem ser feitas, como se comportam e organiza o que vibra junto em grupos reconhecíveis.',
    status: 'ativo',
    color: '#7a9e7e'
  },
  // Futuras ferramentas...
]

export default function GaleriaPage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex flex-col gap-8 px-12 py-12">
      {/* Logo bicho */}
      <div className="relative w-[216px] h-[71px]">
        <Image
          src="/bicho-logo-galeria.svg"
          alt="bicho"
          fill
          className="object-contain object-left"
          draggable={false}
        />
      </div>

      {/* Título e cards */}
      <div className="w-full flex flex-col gap-3">
        <h1
          className="text-[38px] text-black leading-normal"
          style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700 }}
        >
          Experimentos
        </h1>

        {/* Scroll horizontal de ferramentas */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/galeria/${tool.id}`}
              className="relative flex-shrink-0 w-[549px] h-[575px] rounded-[37px] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: tool.color }}
            >
              {/* Versão no topo */}
              <p
                className="absolute top-[42px] left-[41px] text-[14px] text-black"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                {tool.version}
              </p>

              {/* Logo Vibe Engine no centro */}
              <div className="absolute top-[242px] left-[41px] w-[375px] h-[55px]">
                <Image
                  src="/vibe-engine-galeria.svg"
                  alt="Vibe Engine"
                  fill
                  className="object-contain object-left"
                  draggable={false}
                />
              </div>

              {/* Ícone de seta */}
              <div className="absolute top-[254.73px] right-[54px] w-[32px] h-[31px]">
                <Image
                  src="/arrow-icon.svg"
                  alt="Ver mais"
                  fill
                  className="object-contain"
                  draggable={false}
                />
              </div>

              {/* Badge ativo */}
              {tool.status === 'ativo' && (
                <div className="absolute top-[316px] left-[41px] bg-black rounded-full px-[10px] py-[8px]">
                  <p
                    className="text-[14px] text-white"
                    style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
                  >
                    ativo
                  </p>
                </div>
              )}

              {/* Descrição */}
              <p
                className="absolute top-[373px] left-[41px] text-[24px] text-black text-justify leading-normal w-[393.631px]"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                {tool.description}
              </p>
            </Link>
          ))}

          {/* Card placeholder cinza */}
          <div className="flex-shrink-0 w-[549px] h-[575px] rounded-[37px] bg-[#ececec]" />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full">
        <Link
          href="/"
          className="text-black text-[18px] hover:opacity-70 transition-opacity"
          style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700 }}
        >
          [Voltar]
        </Link>
      </div>
    </main>
  )
}

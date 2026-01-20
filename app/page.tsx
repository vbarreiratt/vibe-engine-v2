// app/page.tsx
// Home page do Laboratório Bicho - Design atualizado (node-id: 47:5)

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex flex-col items-center px-6 py-12 relative">
      {/* Container principal */}
      <div className="w-full max-w-[1200px] flex flex-col gap-[53px]">

        {/* Logo "bicho" grande no topo */}
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-[843px] h-[200px] md:h-[251px]">
            <Image
              src="/bicho-v2.svg"
              alt="bicho"
              fill
              className="object-contain"
              draggable={false}
              priority
            />
          </div>
        </div>

        {/* "LABORATÓRIO" label + palavras-chave */}
        <div className="w-full flex flex-col md:flex-row items-start">
          {/* Espaço vazio à esquerda */}
          <div className="hidden md:block md:w-[164px]">
            <p
              className="uppercase underline decoration-solid text-black text-[18px]"
              style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
            >
              Laboratório
            </p>
          </div>

          {/* Palavras-chave alinhadas à direita */}
          <div className="flex-1 flex justify-center md:justify-end md:pr-[100px]">
            <div
              className="lowercase text-black text-[18px] leading-[21px]"
              style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
            >
              <p className="m-0">estratégia</p>
              <p className="m-0">design</p>
              <p className="m-0">tecnologia</p>
            </div>
          </div>
        </div>

        {/* Conteúdo principal - duas colunas de texto */}
        <div className="w-full flex flex-col md:flex-row gap-8 md:gap-12 md:pl-[164px]">
          {/* Coluna 1 */}
          <div className="flex-1">
            <div
              className="text-[18px] text-black text-justify leading-relaxed"
              style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
            >
              <p className="mb-4">
                O Laboratório Bicho é o braço experimental do estúdio, onde testamos sistemas, aplicações e metodologias que ainda não sabemos se vão funcionar, mas sentimos que deveriam existir.
              </p>
              <p className="mb-0">
                Desenvolvemos ferramentas para problemas de cultura, design e estratégia. Não acreditamos que tecnologia resolve tudo, mas acreditamos que ela pode potencializar o trabalho humano quando está no lugar certo: como suporte, não como protagonista.
              </p>
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="flex-1">
            <div
              className="text-[18px] text-black text-justify leading-relaxed"
              style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
            >
              <p className="mb-4">
                Todas as ferramentas do Lab operam nesse pilar, a visão cultural, artística e criativa no centro. A inovação a serviço do olhar humano, não o contrário.{' '}
                <Link
                  href="/governanca"
                  className="underline decoration-solid hover:opacity-70 transition-opacity"
                  title="Conheça como usamos IA de forma segura em nossos projetos"
                >
                  Agentes de IA como colaboradores, não substitutos
                </Link>.
              </p>
              <p className="mb-0">
                Porque estamos em fase experimental, alguns bugs e imperfeições podem aparecer. Estamos aprendendo no processo, assim como você.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com links */}
        <div className="w-full flex items-center justify-between md:px-0">
          <Link
            href="/sobre"
            className="text-black text-[18px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 700 }}
          >
            [Sobre]
          </Link>
          <Link
            href="/galeria"
            className="text-black text-[18px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 700 }}
          >
            [Catálogo]
          </Link>
        </div>

      </div>
    </main>
  );
}

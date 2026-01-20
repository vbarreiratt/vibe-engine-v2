// app/sobre/page.tsx
// Página institucional sobre o Laboratório Bicho

import Link from 'next/link'

export default function SobrePage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1]">
      {/* Container principal */}
      <div className="relative w-full max-w-[900px] mx-auto px-8 md:px-20 py-16 md:py-24">

        {/* Breadcrumb */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-[14px] md:text-[16px] text-black/60 hover:text-black transition-colors"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
          >
            ← Voltar para home
          </Link>
        </div>

        {/* Title */}
        <h1
          className="text-[48px] md:text-[72px] font-light text-black mb-8"
          style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
        >
          Sobre a Bicho
        </h1>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none text-black/80 space-y-8"
          style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
        >
          <section>
            <h2 className="text-[32px] font-medium text-black mb-4">O que é o Laboratório Bicho</h2>
            <p className="text-[18px] leading-relaxed mb-4">
              O Laboratório Bicho é um espaço de pesquisa, design e tecnologia que investiga atmosferas,
              sensações e significados que emergem da relação entre pessoas, imagens e contextos.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              Não queremos transformar tudo em conceito nem dar respostas prontas. O que nos interessa
              é criar ferramentas que ajudem a observar, organizar e entender essas sensações sem tirar
              delas o que elas têm de intuitivo.
            </p>
          </section>

          <section>
            <h2 className="text-[32px] font-medium text-black mb-4">Por que "Laboratório"</h2>
            <p className="text-[18px] leading-relaxed mb-4">
              Porque tudo aqui é experimental. As ferramentas que desenvolvemos são tentativas de criar
              leituras possíveis, não verdades absolutas. Elas evoluem, mudam, são testadas e às vezes
              abandonadas.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              Trabalhamos com metodologias abertas, código transparente e processos documentados.
              Acreditamos que ferramentas criativas devem ser auditáveis, modificáveis e questionáveis.
            </p>
          </section>

          <section>
            <h2 className="text-[32px] font-medium text-black mb-4">Nossas Ferramentas</h2>
            <p className="text-[18px] leading-relaxed mb-4">
              Cada ferramenta do Laboratório Bicho é pensada como um instrumento epistemológico -
              algo que não apenas organiza informação, mas que propõe uma forma específica de olhar
              e entender.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              O <strong>Vibe Engine</strong>, nossa primeira ferramenta pública, é um sistema para
              reconhecimento e ressonância de atmosferas visuais. Ele combina inteligência artificial
              com curadoria humana para transformar moodboards em ferramentas operacionais de
              investigação criativa.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              <Link href="/galeria" className="underline hover:no-underline">
                Explore a galeria de ferramentas →
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-[32px] font-medium text-black mb-4">Tecnologia e Privacidade</h2>
            <p className="text-[18px] leading-relaxed mb-4">
              Utilizamos inteligência artificial de forma consciente e transparente. Nossos sistemas
              são desenhados com privacidade por design e todos os dados são tratados conforme LGPD.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              Não usamos dados de usuários para treinar modelos. Não vendemos informações.
              Não fazemos rastreamento além do essencial para funcionalidade.
            </p>
            <p className="text-[18px] leading-relaxed mb-4">
              <Link href="/governanca" className="underline hover:no-underline">
                Leia nossa política de governança de dados →
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-[32px] font-medium text-black mb-4">Princípios</h2>
            <ul className="list-disc list-inside space-y-2 text-[18px] leading-relaxed ml-4">
              <li>Experimentação como método</li>
              <li>Transparência técnica e conceitual</li>
              <li>Respeito à intuição e ao sensível</li>
              <li>Ferramentas como proposições, não certezas</li>
              <li>Privacidade e autonomia dos dados</li>
              <li>Código e metodologia abertos</li>
            </ul>
          </section>

          <section className="border-t border-black/10 pt-8 mt-12">
            <h2 className="text-[32px] font-medium text-black mb-4">Contato</h2>
            <p className="text-[18px] leading-relaxed mb-4">
              Para conversas, parcerias ou dúvidas sobre o Laboratório:
            </p>
            <p className="text-[18px] leading-relaxed mb-2">
              <strong>Email:</strong> <a href="mailto:contato@estudiobicho.com.br" className="underline hover:no-underline">contato@estudiobicho.com.br</a>
            </p>
            <p className="text-[18px] leading-relaxed">
              <strong>GitHub:</strong> <a href="https://github.com/estudiobicho" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">@estudiobicho</a>
            </p>
          </section>
        </div>

      </div>
    </main>
  )
}

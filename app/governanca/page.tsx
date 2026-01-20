// app/governanca/page.tsx
// Página de Governança de Dados - Design atualizado (node-id: 47:20)

import Link from 'next/link'
import Image from 'next/image'

export default function GovernancaPage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex flex-col items-center px-6 py-12">
      {/* Container principal */}
      <div className="w-full max-w-[1200px] flex flex-col gap-[53px]">

        {/* Logo + Conteúdo */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-[35px] items-start justify-center">

          {/* Logo */}
          <div className="relative w-[220px] h-[72px] shrink-0">
            <Image
              src="/bicho-logo-small.svg"
              alt="bicho"
              fill
              className="object-contain"
              draggable={false}
            />
          </div>

          {/* Conteúdo principal */}
          <div className="flex flex-col gap-12 w-full md:w-[448px] text-black">

            {/* Seção: Título principal */}
            <div className="flex flex-col gap-5">
              <h1
                className="text-[48px] leading-normal"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 500 }}
              >
                Como a gente cuida dos seus dados
              </h1>
              <p
                className="text-[18px] text-justify leading-normal"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                A gente usa IA em algumas ferramentas do Lab, mas com uma premissa bem clara:{' '}
                <strong>seus dados são seus.</strong> A gente não acredita que tecnologia deva ser uma caixa-preta assustadora, então vamos explicar exatamente como funciona.
              </p>
            </div>

            {/* Seção: Nossa escolha técnica */}
            <div className="flex flex-col gap-5 text-[18px] text-justify">
              <p
                className="leading-normal"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 500 }}
              >
                Nossa escolha técnica (e por quê ela importa)
              </p>
              <div
                className="leading-normal"
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                <p className="mb-0">
                  A gente trabalha com Vertex AI, que é a plataforma{' '}
                  <strong>corporativa de IA do Google Cloud</strong>. Não é Gemini de graça, não é ChatGPT, é um ambiente empresarial pago com governança estrita de privacidade.
                </p>
                <p className="my-4">&nbsp;</p>
                <p>
                  <strong>Por quê isso importa?</strong> Porque ferramentas gratuitas de IA geralmente usam seus dados para melhorar os modelos{' '}
                  <strong>(é o preço de não pagar com dinheiro: você paga com dados).</strong> A gente escolheu o caminho oposto: pagar pela infraestrutura para garantir que seus dados não virem treino de máquina.
                </p>
              </div>
            </div>

            {/* Seção: O que acontece com seus dados */}
            <div className="flex flex-col gap-5 text-[18px] text-justify leading-normal">
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 500 }}
              >
                O que acontece com o que você manda pra gente
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                Quando você usa uma ferramenta do Lab:
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                a. Seus prompts, imagens e respostas ficam isolados. Eles não saem do nosso projeto no Google Cloud.
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                b. Nada disso vira treino de IA. Seus dados não são incorporados aos modelos globais do Google.
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                c. Tudo é criptografado. Tanto quando está guardado quanto quando está sendo processado.
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                d. A gente não vê seus dados pessoais. Nossa infraestrutura processa, mas a gente como equipe não fica fuçando no que você manda.
              </p>
            </div>

            {/* Seção: Conformidade legal */}
            <div className="flex flex-col gap-5 text-[18px] text-justify leading-normal">
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 500 }}
              >
                Conformidade legal (em português claro)
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                A gente opera sob o Cloud Data Processing Addendum (CDPA) do Google Cloud, que é o contrato que garante conformidade com:
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                GDPR (lei de privacidade europeia)
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 300 }}
              >
                LGPD (lei brasileira de proteção de dados)
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                Isso não é marketing. É obrigação contratual. Se o Google descumprir, ele responde legalmente.
              </p>
            </div>

            {/* Seção: Por que a gente faz questão disso */}
            <div className="flex flex-col gap-5 text-[18px] text-justify leading-normal">
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 500 }}
              >
                Por que a gente faz questão disso
              </p>
              <p
                style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 400 }}
              >
                Porque acreditamos que inovação não pode vir às custas de privacidade. Se uma ferramenta precisa dos seus dados para funcionar, ela deveria deixar isso cristalino. A gente prefere pagar mais caro pela infraestrutura e dormir tranquilo sabendo que estamos do lado certo dessa história.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="w-full">
          <Link
            href="/"
            className="text-black text-[18px] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 700 }}
          >
            [Voltar]
          </Link>
        </div>

      </div>
    </main>
  )
}

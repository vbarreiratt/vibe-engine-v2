// app/page.tsx
// Nova tela home baseada no design Figma (node-id: 17:9195)
// Design para desktop 1440px width + responsivo mobile

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex justify-center">
      {/* Container principal - responsivo */}
      <div className="relative w-full max-w-[1440px] min-h-screen px-4 md:px-0">

        {/* Logo SVG - stroke preto, preenchimento da cor do fundo */}
        {/* Desktop: posição fixa | Mobile: achatado verticalmente e centralizado */}
        <div className="absolute top-[20px] left-0 right-0 w-full h-[180px] md:top-[40px] md:left-0 md:h-[280px] z-[5]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bicho-v2.svg"
            alt="bicho"
            className="w-full h-full"
            style={{
              objectFit: "contain",
              objectPosition: "left center"
            }}
            draggable={false}
          />
        </div>

        {/* ESTÚDIO - posicionado ao lado do B de bicho */}
        {/* Mobile: canto superior esquerdo | Desktop: posição original */}
        <p
          className="absolute left-[20px] top-[75px] md:left-[120px] md:top-[215px] z-10 uppercase underline decoration-solid text-black text-[14px] md:text-[18px]"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
        >
          estúdio
        </p>

        {/* Palavras - pesquisa, design, tecnologia - abaixo da letra B */}
        {/* Mobile: lado direito alinhado | Desktop: posição original */}
        <div
          className="absolute right-[20px] top-[220px] md:left-[320px] md:top-[320px] md:right-auto z-10 text-right md:text-left lowercase text-black text-[14px] md:text-[18px] leading-[18px] md:leading-[21px]"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
        >
          <p className="m-0">pesquisa</p>
          <p className="m-0">design</p>
          <p className="m-0">tecnologia</p>
        </div>

        {/* Text Field - Duas colunas de texto */}
        {/* Mobile: coluna única | Desktop: duas colunas lado a lado */}
        <div className="absolute left-[20px] right-[20px] top-[310px] md:left-[525px] md:right-auto md:top-[330px] flex flex-col md:flex-row md:gap-[80px] gap-[20px] z-10">
          {/* Coluna 1 */}
          <div
            className="w-full md:w-[225px] text-justify text-black text-[14px] md:text-[18px] leading-[21px] md:leading-[27px]"
            style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
          >
            <p className="m-0 mb-[20px] md:mb-[27px]">Sabe quando você entra em um lugar, olha uma imagem ou escuta uma música e sente que alguma coisa aconteceu?</p>
            <p className="m-0 mb-[20px] md:mb-[27px]">Você não para muito para pensar e nem tenta explicar, mas sente.</p>
            <p className="m-0 mb-[20px] md:mb-[27px]">Às vezes é leve, às vezes estranho, intenso, confortável ou esquisito.</p>
            <p className="m-0">Às vezes, duram poucos segundos, às vezes, muito tempo.</p>
          </div>

          {/* Coluna 2 */}
          <div
            className="w-full md:w-[225px] text-justify text-black text-[14px] md:text-[18px] leading-[21px] md:leading-[27px]"
            style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
          >
            <p className="m-0 mb-[20px] md:mb-[27px]">Esse algo sem nome é como entendemos o significado de Vibe.</p>
            <p className="m-0 mb-[20px] md:mb-[27px]">E essa ferramenta existe para ajudar a observar, organizar e entender essas sensações sem tirar delas o que elas têm de intuitivo.</p>
            <p className="m-0">Não é para transformar tudo em conceito, nem para dar respostas prontas, mas tentar criar leitura.</p>
          </div>
        </div>

        {/* Meta Field - Texto pequeno no canto inferior direito */}
        {/* Mobile: posição ajustada | Desktop: canto inferior direito */}
        <div className="absolute left-[20px] right-[20px] bottom-[100px] md:left-auto md:right-[140px] md:top-[580px] md:bottom-auto z-10">
          <p
            className="w-full md:w-[174px] text-black text-[10px] md:text-[12px] leading-[15px] md:leading-[18px]"
            style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
          >
            Este sistema ainda está em fase experimental. Algumas coisas podem mudar e tudo bem.
          </p>
        </div>

        {/* Actions - Links inferiores */}
        {/* Mobile: empilhados centralizados | Desktop: distribuídos nas extremidades */}
        <div
          className="absolute left-[20px] right-[20px] bottom-[30px] md:left-[140px] md:right-[140px] md:bottom-[60px] flex flex-col md:flex-row items-center justify-between gap-[10px] md:gap-0 text-black text-[14px] md:text-[18px] lowercase z-10"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 700 }}
        >
          <Link href="/sobre" className="m-0 hover:opacity-70 transition-opacity">[sobre a bicho]</Link>
          <Link href="/login" className="m-0 hover:opacity-70 transition-opacity">[acessar vibe-engine]</Link>
        </div>
      </div>
    </main>
  );
}

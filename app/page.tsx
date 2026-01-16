import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] text-[#1a1a1a] selection:bg-zinc-300 selection:text-black font-sans relative overflow-hidden flex flex-col items-center p-6 md:p-12 lg:p-16">
        
        {/* Main Content Container - Flex Column with gap */}
        <div className="flex flex-col gap-24 md:gap-32 w-full max-w-[1600px] flex-1">
            
            {/* Top Section: Brand + Content */}
            <div className="flex flex-col gap-12 w-full items-start">
            
                {/* 1. Brand Field - Top Header */}
                <div className="w-full flex justify-between items-start relative pb-4 md:pb-8">
                     {/* Left: Brand Name */}
                    <div className="z-10 mt-12 md:mt-24">
                        <span className="block font-mono text-xs uppercase tracking-[0.2em] border-b border-black/10 pb-2 w-max">
                            Laboratório
                         </span>
                    </div>

                    {/* Center/Background: Blob */}
                    <div className="absolute top-0 right-0 left-0 bottom-0 flex justify-center items-start pointer-events-none opacity-90 mix-blend-multiply">
                        <div className="w-full max-w-4xl h-64 md:h-96 relative">
                             <svg viewBox="0 0 1000 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-[#Eaeae5]">
                                <path d="M50.5,50.7C150.2,20.5,300.9,10.2,450.4,30.6C600,51,750,102,850.5,120.7C951,139.4,990,180,950.5,220.7C911,261.4,793,300,650.4,280.6C507.8,261.2,340.6,183.8,200.5,150.7C60.4,117.6,-49.2,80.9,50.5,50.7Z" />
                             </svg>
                        </div>
                    </div>

                     {/* Right: Brand Descriptors */}
                    <div className="z-10 mt-12 md:mt-24 flex flex-col text-sm md:text-base font-normal text-zinc-600 italic leading-snug text-right">
                        <span>pesquisa</span>
                        <span>design</span>
                        <span>tecnologia</span>
                    </div>
                </div>

                {/* 2. Text Field - Editorial Content */}
                <div className="w-full flex flex-col md:flex-row gap-8 md:gap-24 items-start max-w-5xl mx-auto z-10">
                    
                    {/* Column 1 */}
                    <div className="flex-1 flex flex-col gap-6 text-xl md:text-2xl leading-relaxed font-normal text-black text-justify">
                        <p>Sabe quando você entra em um lugar, olha uma imagem ou escuta uma música e sente que alguma coisa aconteceu?</p>
                        <p>Você não para muito para pensar e nem tenta explicar, mas sente.</p>
                        <p>Às vezes é leve, às vezes estranho, intenso, confortável ou esquisito.</p>
                        <p>Às vezes, duram poucos segundos, às vezes, muito tempo.</p>
                    </div>

                    {/* Column 2 */}
                    <div className="flex-1 flex flex-col gap-6 text-xl md:text-2xl leading-relaxed font-normal text-black text-justify">
                        <p>Esse algo sem nome é como entendemos o significado de Vibe.</p>
                        <p>E essa ferramenta existe para ajudar a observar, organizar e entender essas sensações sem tirar delas o que elas têm de intuitivo.</p>
                        <p>Não é para transformar tudo em conceito, nem para dar respostas prontas, mas tentar criar leitura.</p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Actions/Meta - Pushed to bottom */}
            <div className="mt-auto w-full flex flex-row justify-between items-end border-t border-black/5 pt-8">
                 
                 {/* Left Action */}
                 <a href="https://estudiobicho.com.br" target="_blank" rel="noopener noreferrer" className="group text-lg font-bold lowercase tracking-tight hover:opacity-70 transition-opacity">
                    sobre a bicho
                </a>

                {/* Right Action */}
                <Link href="/dashboard" className="group text-lg font-bold lowercase tracking-tight text-right hover:opacity-70 transition-opacity">
                    Acessar vibe-engine
                </Link>
            </div>
        </div>
    </main>
  )
}

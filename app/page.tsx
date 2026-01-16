import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] text-[#1a1a1a] selection:bg-zinc-300 selection:text-black font-sans relative overflow-hidden flex flex-col">
        
        {/* Layout container */}
        <div className="w-full max-w-[1600px] flex-1 mx-auto relative p-6 md:p-12 lg:p-16 flex flex-col justify-between">
            
            {/* Top / Brand Area */}
            <div className="relative w-full">
                
                {/* 1. Brand Field (Top Left) */}
                <div className="flex flex-col gap-6 md:absolute md:top-12 md:left-0 md:max-w-xs z-10 pointer-events-none">
                    <div className="relative w-40 h-40 md:w-56 md:h-56 -ml-4 -mt-4 mix-blend-multiply opacity-90">
                        {/* Organic Blob SVG representing 'Bicho' */}
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-[#Eaeae5]">
                             <path d="M42.7,-72.2C54.9,-66.5,63.9,-54.6,71.1,-42.6C78.4,-30.5,83.9,-18.4,82.4,-7.1C80.9,4.2,72.4,14.7,64.1,24.8C55.7,34.9,47.5,44.5,37.6,51.8C27.7,59.1,16.1,64,4.2,64.7C-7.7,65.4,-19.9,61.9,-31.6,55.7C-43.3,49.5,-54.5,40.7,-62.7,29.9C-70.9,19.1,-76.1,6.4,-75.4,-6.1C-74.6,-18.6,-67.9,-30.9,-58.5,-40.8C-49.1,-50.7,-37,-58.2,-25,-63.9C-13,-69.6,0,-73.5,12.7,-72.1C25.4,-70.7,30.5,-77.9,42.7,-72.2Z" transform="translate(100 100)" />
                        </svg>
                    </div>
                     {/* Brand Text */}
                    <div className="absolute top-1/2 left-8 transform -translate-y-1/2 pointer-events-auto">
                         <span className="block font-mono text-xs uppercase tracking-[0.2em] border-b border-black/10 pb-2 mb-3 w-max">
                            Laboratório
                         </span>
                         <div className="flex flex-col text-sm md:text-base font-normal text-zinc-600 italic leading-snug">
                            <span>pesquisa</span>
                            <span>design</span>
                            <span>tecnologia</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* 2. Text Field (Center / Rightish) - Main Reading Flow */}
            <div className="flex-1 flex flex-col justify-center items-center py-16 md:py-0">
                <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-y-10 gap-x-12 px-2 md:px-0">
                    
                    {/* First text block */}
                    <div className="md:col-start-4 md:col-span-4 flex flex-col gap-6 text-lg md:text-[1.15rem] leading-relaxed font-light text-[#1a1a1a]">
                        <p>Sabe quando você entra em um lugar, olha uma imagem ou escuta uma música e sente que alguma coisa aconteceu?</p>
                        <p>Você não para muito para pensar e nem tenta explicar, mas sente.</p>
                        <p>Às vezes é leve, às vezes estranho, intenso, confortável ou esquisito.</p>
                        <p>Às vezes, duram poucos segundos, às vezes, muito tempo.</p>
                    </div>

                    {/* Second text block - visually offset */}
                    <div className="md:col-start-8 md:col-span-4 flex flex-col gap-6 text-lg md:text-[1.15rem] leading-relaxed font-light text-[#1a1a1a] md:pt-32">
                        <p>Esse algo sem nome é como entendemos o significado de Vibe.</p>
                        <p>E essa ferramenta existe para ajudar a observar, organizar e entender essas sensações sem tirar delas o que elas têm de intuitivo.</p>
                        <p>Não é para transformar tudo em conceito, nem para dar respostas prontas, mas tentar criar leitura.</p>
                    </div>
                </div>
            </div>

            {/* Bottom Footer Area */}
            <div className="relative flex flex-col-reverse md:flex-row justify-between items-end w-full pb-4">
                 
                 {/* 4. Actions (Bottom Left) */}
                 <div className="w-full md:w-auto flex flex-col items-start gap-2 md:gap-1 text-lg font-medium tracking-tight mt-12 md:mt-0">
                    <Link href="/dashboard" className="group flex items-center gap-2 hover:opacity-70 transition-opacity">
                        <span>acessar vibe-engine</span>
                    </Link>
                    <a href="https://estudiobicho.com.br" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-zinc-500 hover:text-black hover:opacity-70 transition-all">
                        <span>sobre a bicho</span>
                    </a>
                 </div>

                 {/* 3. Meta Field (Bottom Right) */}
                 <div className="w-full md:w-auto flex flex-col gap-1 text-xs text-zinc-400 font-medium md:text-right items-start md:items-end max-w-md">
                    <p>Este sistema ainda está em fase experimental. Algumas coisas podem mudar — e tudo bem.</p>
                    <div className="h-2"></div>
                    <p className="opacity-75">Um projeto do Bicho.lab — Frente de inovação e experimentação do estúdio Bicho.</p>
                 </div>
            </div>
        </div>
    </main>
  )
}


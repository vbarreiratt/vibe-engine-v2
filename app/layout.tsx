import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Vibe Engine',
  description: 'Reconhecimento e ressonância de atmosferas visuais.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={cn(
        outfit.variable,
        "font-sans antialiased bg-zinc-950 text-zinc-100 min-h-screen"
      )}>
        {children}
      </body>
    </html>
  )
}

// app/sobre/page.tsx
// Página "Sobre a Bicho" (dummy)

export default function SobrePage() {
  return (
    <main className="min-h-screen w-full bg-[#f4f4f1] flex items-center justify-center p-8">
      <div className="text-center">
        <h1
          className="text-4xl mb-4 uppercase"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 700 }}
        >
          Sobre a Bicho
        </h1>
        <p
          className="text-lg mb-8"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 400 }}
        >
          Esta página está em construção.
        </p>
        <a
          href="/"
          className="text-black underline hover:opacity-70 transition-opacity lowercase"
          style={{ fontFamily: 'Helvetica Neue, Satoshi, sans-serif', fontWeight: 700 }}
        >
          [voltar para home]
        </a>
      </div>
    </main>
  );
}

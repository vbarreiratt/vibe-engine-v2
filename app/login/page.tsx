import { login } from './actions'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="inline-block p-3 rounded-full bg-zinc-800 mb-2">
                        <div className="w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Vibe Engine</h1>
                    <p className="text-zinc-400 text-sm">Acesse o sistema de curadoria e ressonância.</p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="email">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                            placeholder="curador@vibeengine.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300" htmlFor="password">Senha</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-zinc-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button formAction={login} className="w-full bg-white text-black py-2.5 rounded-md font-medium hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 text-sm">
                            Entrar
                        </button>
                    </div>

                    <p className="text-xs text-center text-zinc-600">
                        Acesso restrito a curadores autorizados.<br />
                        Solicite acesso ao administrador.
                    </p>
                </form>
            </div>
        </div>
    )
}

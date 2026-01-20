"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { login } from "./actions"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError("")

    const result = await login(formData)

    // Se houver erro, atualiza o estado
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
    // Se não houver erro, o redirect acontece e não chegamos aqui
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Back button */}
      <div className="p-6">
        <Link
          href="/ferramentas/vibe-engine"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-12">
            <img
              src="/vibe.svg"
              alt="Vibe Engine"
              className="h-16 md:h-20 w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white font-serif mb-3">
              Bem-vindo de volta
            </h1>
            <p className="text-white/50 text-base">
              Entre na sua conta para continuar vibrando
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-lg focus:border-[#c4f567] focus:ring-[#c4f567]/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                  Senha
                </Label>
                <Link
                  href="#"
                  className="text-sm text-[#c4f567] hover:text-[#d4ff77] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-lg pr-12 focus:border-[#c4f567] focus:ring-[#c4f567]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#c4f567] text-black hover:bg-[#b8e557] font-semibold text-base h-12 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-12">
            by <span className="italic font-serif">Estudio Bicho</span>
          </p>
        </div>
      </div>
    </div>
  )
}

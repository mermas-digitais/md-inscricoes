"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"welcome" | "verify">("welcome")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("verify")
        toast({
          title: "Código enviado!",
          description: "Verifique seu email e digite o código de 6 dígitos.",
        })
      } else {
        throw new Error(data.error || "Erro ao enviar código")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length !== 6) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      if (response.ok) {
        // Redirecionar para o formulário de inscrição
        window.location.href = `/inscricao?email=${encodeURIComponent(email)}`
      } else {
        const data = await response.json()
        throw new Error(data.error || "Código inválido")
      }
    } catch (error) {
      toast({
        title: "Código inválido",
        description: error instanceof Error ? error.message : "Verifique o código e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Verifique seu email
            </CardTitle>
            <CardDescription>
              Enviamos um código de 6 dígitos para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? "Verificando..." : "Verificar código"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("welcome")
                  setVerificationCode("")
                }}
              >
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Mermãs Digitais
            </h1>
            <p className="text-gray-600 mt-2">Capacitando meninas em tecnologia 💜</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Pronta para mergulhar no mundo da tecnologia? 🚀
          </h2>
          <p className="text-lg text-gray-600 mb-8">Faça sua inscrição em apenas 3 passos simples!</p>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">1. Confirme seu email</h3>
              <p className="text-gray-600 text-sm">Digite seu melhor email e confirme com o código que enviaremos</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">2. Preencha seus dados</h3>
              <p className="text-gray-600 text-sm">Conte um pouco sobre você e sua vida escolar</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-indigo-100">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">3. Confirme seu curso</h3>
              <p className="text-gray-600 text-sm">Vamos te mostrar o curso perfeito para você!</p>
            </div>
          </div>
        </div>

        {/* Email Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-800">Vamos começar! ✨</CardTitle>
            <CardDescription>Digite seu melhor email para receber o código de verificação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3"
                disabled={!email || isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar código de verificação"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Dúvidas? Entre em contato conosco pelo Instagram{" "}
            <a href="#" className="text-pink-600 font-semibold">
              @mermasdigitais
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, GraduationCap, Users, MapPin } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FormData {
  email: string
  nome: string
  cpf: string
  data_nascimento: string
  cep: string
  cidade: string
  estado: string
  nome_responsavel: string
  telefone_whatsapp: string
  escolaridade: string
  ano_escolar: string
}

export default function InscricaoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: searchParams.get("email") || "",
    nome: "",
    cpf: "",
    data_nascimento: "",
    cep: "",
    cidade: "",
    estado: "",
    nome_responsavel: "",
    telefone_whatsapp: "",
    escolaridade: "",
    ano_escolar: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1")
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1")
  }

  const fetchAddressByCEP = async (cep: string) => {
    if (cep.replace(/\D/g, "").length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            cidade: data.localidade,
            estado: data.uf,
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === "cpf") {
      value = formatCPF(value)
    } else if (field === "telefone_whatsapp") {
      value = formatPhone(value)
    } else if (field === "cep") {
      value = formatCEP(value)
      if (value.replace(/\D/g, "").length === 8) {
        fetchAddressByCEP(value)
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Reset ano_escolar when escolaridade changes
    if (field === "escolaridade") {
      setFormData((prev) => ({ ...prev, ano_escolar: "" }))
    }
  }

  const getAnoEscolarOptions = () => {
    if (formData.escolaridade === "Ensino Fundamental 2") {
      return ["6º ano", "7º ano", "8º ano", "9º ano"]
    } else if (formData.escolaridade === "Ensino Médio") {
      return ["1º ano", "2º ano", "3º ano"]
    }
    return []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { curso } = await response.json()
        router.push(`/confirmacao?curso=${encodeURIComponent(curso)}&email=${encodeURIComponent(formData.email)}`)
      } else {
        throw new Error("Erro ao salvar inscrição")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua inscrição. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.nome && formData.cpf && formData.data_nascimento
      case 2:
        return formData.cep && formData.cidade && formData.estado
      case 3:
        return formData.nome_responsavel && formData.telefone_whatsapp
      case 4:
        return formData.escolaridade && formData.ano_escolar
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Formulário de Inscrição
            </h1>
            <p className="text-gray-600 mt-2">Passo {currentStep} de 4</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Dados Pessoais */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Sobre você</CardTitle>
                    <CardDescription>Conte um pouco sobre quem você é</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="data_nascimento">Data de nascimento *</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => handleInputChange("data_nascimento", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Endereço */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Onde você mora</CardTitle>
                    <CardDescription>Precisamos saber sua localização</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" value={formData.cidade} readOnly placeholder="Cidade" className="bg-gray-50" />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input id="estado" value={formData.estado} readOnly placeholder="UF" className="bg-gray-50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Responsável */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-pink-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Seu responsável</CardTitle>
                    <CardDescription>Dados do pai, mãe ou responsável</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome_responsavel">Nome completo do responsável *</Label>
                  <Input
                    id="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={(e) => handleInputChange("nome_responsavel", e.target.value)}
                    placeholder="Nome do pai, mãe ou responsável"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone_whatsapp">WhatsApp do responsável *</Label>
                  <Input
                    id="telefone_whatsapp"
                    value={formData.telefone_whatsapp}
                    onChange={(e) => handleInputChange("telefone_whatsapp", e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Vida Escolar */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Sua vida escolar</CardTitle>
                    <CardDescription>Conte sobre seus estudos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="escolaridade">Escolaridade *</Label>
                  <Select
                    value={formData.escolaridade}
                    onValueChange={(value) => handleInputChange("escolaridade", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua escolaridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ensino Fundamental 2">Ensino Fundamental 2</SelectItem>
                      <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.escolaridade && (
                  <div>
                    <Label htmlFor="ano_escolar">Ano escolar *</Label>
                    <Select
                      value={formData.ano_escolar}
                      onValueChange={(value) => handleInputChange("ano_escolar", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAnoEscolarOptions().map((ano) => (
                          <SelectItem key={ano} value={ano}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Voltar
              </Button>
            )}
            {currentStep < 4 ? (
              <Button
                type="button"
                className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Próximo
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={!isStepValid(currentStep) || isLoading}
              >
                {isLoading ? "Salvando..." : "Finalizar inscrição"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

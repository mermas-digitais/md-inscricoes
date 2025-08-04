"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Upload, Check, X, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Inscricao {
  id: string
  nome: string
  email: string
  cpf: string
  data_nascimento: string
  cep: string
  cidade: string
  estado: string
  nome_responsavel: string
  telefone_whatsapp: string
  escolaridade: string
  ano_escolar: string
  status: "INSCRITA" | "MATRICULADA" | "CANCELADA"
  curso: string
  created_at: string
  documento_rg_cpf?: string
  documento_declaracao?: string
  documento_termo?: string
}

export default function MonitorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [filteredInscricoes, setFilteredInscricoes] = useState<Inscricao[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInscricao, setSelectedInscricao] = useState<Inscricao | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/monitor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        loadInscricoes()
      } else {
        toast({
          title: "Código inválido",
          description: "Verifique o código de acesso e tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadInscricoes = async () => {
    try {
      const response = await fetch("/api/monitor/inscricoes")
      if (response.ok) {
        const data = await response.json()
        setInscricoes(data)
        setFilteredInscricoes(data)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar inscrições.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = inscricoes.filter(
      (inscricao) => inscricao.nome.toLowerCase().includes(term.toLowerCase()) || inscricao.cpf.includes(term),
    )
    setFilteredInscricoes(filtered)
  }

  const handleStatusChange = async (id: string, newStatus: "MATRICULADA" | "CANCELADA") => {
    if (newStatus === "CANCELADA") {
      if (!confirm("Tem certeza que deseja cancelar esta inscrição?")) {
        return
      }
    }

    try {
      const response = await fetch("/api/monitor/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (response.ok) {
        loadInscricoes()
        toast({
          title: "Status atualizado",
          description: `Inscrição ${newStatus.toLowerCase()} com sucesso.`,
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (inscricaoId: string, fileType: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("inscricaoId", inscricaoId)
    formData.append("fileType", fileType)

    try {
      const response = await fetch("/api/monitor/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        loadInscricoes()
        toast({
          title: "Arquivo enviado",
          description: "Documento anexado com sucesso.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar arquivo.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      INSCRITA: "default",
      MATRICULADA: "default",
      CANCELADA: "destructive",
    } as const

    const colors = {
      INSCRITA: "bg-yellow-100 text-yellow-800",
      MATRICULADA: "bg-green-100 text-green-800",
      CANCELADA: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Painel do Monitor
            </CardTitle>
            <CardDescription>Digite o código de acesso para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Código de acesso"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? "Verificando..." : "Acessar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedInscricao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Detalhes da Inscrição
              </h1>
              <Button variant="outline" onClick={() => setSelectedInscricao(null)}>
                Voltar
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Dados da Aluna */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Aluna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="text-gray-900">{selectedInscricao.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">CPF</p>
                    <p className="text-gray-900">{selectedInscricao.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
                    <p className="text-gray-900">
                      {new Date(selectedInscricao.data_nascimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedInscricao.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">CEP</p>
                    <p className="text-gray-900">{selectedInscricao.cep}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cidade/Estado</p>
                    <p className="text-gray-900">
                      {selectedInscricao.cidade}/{selectedInscricao.estado}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Responsável</p>
                    <p className="text-gray-900">{selectedInscricao.nome_responsavel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                    <p className="text-gray-900">{selectedInscricao.telefone_whatsapp}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Escolaridade</p>
                    <p className="text-gray-900">{selectedInscricao.escolaridade}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ano Escolar</p>
                    <p className="text-gray-900">{selectedInscricao.ano_escolar}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Curso</p>
                    <p className="text-gray-900">{selectedInscricao.curso}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    {getStatusBadge(selectedInscricao.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentos e Ações */}
            <div className="space-y-6">
              {/* Documentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* RG/CPF */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>RG/CPF</span>
                    </div>
                    {selectedInscricao.documento_rg_cpf ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedInscricao.documento_rg_cpf, "_blank")}
                      >
                        Ver arquivo
                      </Button>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(selectedInscricao.id, "rg_cpf", file)
                          }}
                        />
                        <Button size="sm" variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>

                  {/* Declaração Escolar */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Declaração Escolar</span>
                    </div>
                    {selectedInscricao.documento_declaracao ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedInscricao.documento_declaracao, "_blank")}
                      >
                        Ver arquivo
                      </Button>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(selectedInscricao.id, "declaracao", file)
                          }}
                        />
                        <Button size="sm" variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>

                  {/* Termo de Compromisso */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Termo de Compromisso</span>
                    </div>
                    {selectedInscricao.documento_termo ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedInscricao.documento_termo, "_blank")}
                      >
                        Ver arquivo
                      </Button>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(selectedInscricao.id, "termo", file)
                          }}
                        />
                        <Button size="sm" variant="outline" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              {selectedInscricao.status === "INSCRITA" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(selectedInscricao.id, "MATRICULADA")}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Matrícula
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleStatusChange(selectedInscricao.id, "CANCELADA")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Inscrição
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Painel do Monitor
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{inscricoes.length}</div>
              <p className="text-sm text-gray-600">Total de Inscrições</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {inscricoes.filter((i) => i.status === "INSCRITA").length}
              </div>
              <p className="text-sm text-gray-600">Inscritas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {inscricoes.filter((i) => i.status === "MATRICULADA").length}
              </div>
              <p className="text-sm text-gray-600">Matriculadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {inscricoes.filter((i) => i.status === "CANCELADA").length}
              </div>
              <p className="text-sm text-gray-600">Canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Inscrições */}
        <Card>
          <CardHeader>
            <CardTitle>Inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInscricoes.map((inscricao) => (
                <div
                  key={inscricao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedInscricao(inscricao)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{inscricao.nome}</p>
                        <p className="text-sm text-gray-600">
                          {inscricao.ano_escolar} - {inscricao.curso}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(inscricao.status)}
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

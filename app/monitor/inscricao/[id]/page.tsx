"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Upload, Check, X, FileText, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  telefone_whatsapp: string;
  escolaridade: string;
  ano_escolar: string;
  status: "INSCRITA" | "MATRICULADA" | "CANCELADA" | "EXCEDENTE";
  curso: string;
  created_at: string;
  documento_rg_cpf?: string;
  documento_declaracao?: string;
  documento_termo?: string;
}

export default function InscricaoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inscricaoId = params.id as string;
  const monitorEmail = searchParams.get("email");

  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInscricao();
  }, [inscricaoId]);

  const loadInscricao = async () => {
    try {
      const response = await fetch(`/api/monitor/inscricoes/${inscricaoId}`);
      if (response.ok) {
        const data = await response.json();
        setInscricao(data);
      } else {
        toast({
          title: "Erro",
          description: "Inscrição não encontrada.",
          variant: "destructive",
        });
        router.push(
          `/monitor${
            monitorEmail ? `?email=${encodeURIComponent(monitorEmail)}` : ""
          }`
        );
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar inscrição.",
        variant: "destructive",
      });
      router.push(
        `/monitor${
          monitorEmail ? `?email=${encodeURIComponent(monitorEmail)}` : ""
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "MATRICULADA" | "CANCELADA") => {
    try {
      const response = await fetch("/api/monitor/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inscricaoId, status: newStatus }),
      });

      if (response.ok) {
        setInscricao((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast({
          title: "Status atualizado",
          description: `Status alterado para ${newStatus}`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (fileType: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("inscricaoId", inscricaoId);
    formData.append("fileType", fileType);

    try {
      const response = await fetch("/api/monitor/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Arquivo enviado",
          description: "Arquivo enviado com sucesso.",
        });
        loadInscricao(); // Recarregar para atualizar os dados
      } else {
        toast({
          title: "Erro",
          description: "Erro ao enviar arquivo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar arquivo.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "INSCRITA":
        return <Badge className="bg-blue-100 text-blue-800">Inscrita</Badge>;
      case "MATRICULADA":
        return (
          <Badge className="bg-green-100 text-green-800">Matriculada</Badge>
        );
      case "CANCELADA":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      case "EXCEDENTE":
        return (
          <Badge className="bg-orange-100 text-orange-800">Excedente</Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!inscricao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Inscrição não encontrada</p>
          <Button
            onClick={() => {
              // Verificar se há sessão ativa
              const sessionData = localStorage.getItem("monitorSession");
              if (sessionData) {
                try {
                  const { email: sessionEmail } = JSON.parse(sessionData);
                  router.push(
                    `/monitor?email=${encodeURIComponent(sessionEmail)}`
                  );
                } catch (error) {
                  router.push("/monitor");
                }
              } else {
                router.push("/monitor");
              }
            }}
            className="mt-4"
          >
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                
              <Button
                variant="outline"
                onClick={() => {
                  // Verificar se há sessão ativa
                  const sessionData = localStorage.getItem("monitorSession");
                  if (sessionData) {
                    try {
                      const { email: sessionEmail } = JSON.parse(sessionData);
                      router.push(
                        `/monitor?email=${encodeURIComponent(sessionEmail)}`
                      );
                    } catch (error) {
                      router.push("/monitor");
                    }
                  } else {
                    router.push("/monitor");
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Detalhes da Inscrição
              </h1>
            </div>
            {getStatusBadge(inscricao.status)}
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
                  <p className="text-gray-900">{inscricao.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">CPF</p>
                  <p className="text-gray-900">{inscricao.cpf}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Data de Nascimento
                  </p>
                  <p className="text-gray-900">
                    {new Date(inscricao.data_nascimento).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{inscricao.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p className="text-gray-900">
                    {inscricao.logradouro}, {inscricao.numero}
                    {inscricao.complemento ? `, ${inscricao.complemento}` : ""}
                    <br />
                    {inscricao.bairro} - {inscricao.cidade}/{inscricao.estado}{" "}
                    <br />
                    CEP: {inscricao.cep}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Responsável
                  </p>
                  <p className="text-gray-900">{inscricao.nome_responsavel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                  <p className="text-gray-900">{inscricao.telefone_whatsapp}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Escolaridade
                  </p>
                  <p className="text-gray-900">{inscricao.escolaridade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Ano Escolar
                  </p>
                  <p className="text-gray-900">{inscricao.ano_escolar}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Curso</p>
                  <p className="text-gray-900">{inscricao.curso}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Data de Inscrição
                  </p>
                  <p className="text-gray-900">
                    {new Date(inscricao.created_at).toLocaleDateString("pt-BR")}
                  </p>
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
                  {inscricao.documento_rg_cpf ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(inscricao.documento_rg_cpf, "_blank")
                      }
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
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("rg_cpf", file);
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
                  {inscricao.documento_declaracao ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(inscricao.documento_declaracao, "_blank")
                      }
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
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("declaracao", file);
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
                  {inscricao.documento_termo ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(inscricao.documento_termo, "_blank")
                      }
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
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("termo", file);
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
            {inscricao.status === "INSCRITA" && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange("MATRICULADA")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Matrícula
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusChange("CANCELADA")}
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
  );
}

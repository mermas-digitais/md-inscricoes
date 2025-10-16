"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleHeader } from "@/components/module-header";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CalendarDays,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Modalidade {
  id: string;
  nome: string;
  descricao: string;
  limiteVagas: number;
}

function NovoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    ativo: true,
  });

  const [modalidades, setModalidades] = useState<Modalidade[]>([
    {
      id: "1",
      nome: "",
      descricao: "",
      limiteVagas: 0,
    },
  ]);

  // Verificar autenticação
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos

          if (now - timestamp < sessionTimeout) {
            setIsAuthenticated(true);
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      }

      router.push("/painel");
    };

    checkSession();
  }, [router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModalidadeChange = (index: number, field: string, value: any) => {
    setModalidades((prev) =>
      prev.map((modalidade, i) =>
        i === index ? { ...modalidade, [field]: value } : modalidade
      )
    );
  };

  const addModalidade = () => {
    setModalidades((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nome: "",
        descricao: "",
        limiteVagas: 0,
      },
    ]);
  };

  const removeModalidade = (index: number) => {
    if (modalidades.length > 1) {
      setModalidades((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do evento é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.dataInicio) {
      toast({
        title: "Erro de validação",
        description: "Data de início é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.dataFim) {
      toast({
        title: "Erro de validação",
        description: "Data de fim é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    const inicio = new Date(formData.dataInicio);
    const fim = new Date(formData.dataFim);

    if (inicio >= fim) {
      toast({
        title: "Erro de validação",
        description: "Data de início deve ser anterior à data de fim",
        variant: "destructive",
      });
      return false;
    }

    // Validar modalidades
    const modalidadesValidas = modalidades.filter(
      (m) => m.nome.trim() && m.limiteVagas > 0
    );

    if (modalidadesValidas.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Pelo menos uma modalidade válida é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const modalidadesValidas = modalidades.filter(
        (m) => m.nome.trim() && m.limiteVagas > 0
      );

      const payload = {
        ...formData,
        modalidades: modalidadesValidas,
      };

      const response = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Evento criado com sucesso",
        });
        router.push("/eventos");
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar evento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-poppins">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <ModuleHeader
        moduleName="Eventos"
        moduleDescription="Criar novo evento"
        moduleIcon={Calendar}
        gradientFrom="from-purple-100"
        gradientTo="to-purple-200"
        iconColor="text-purple-700"
      />

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/eventos")}
            className="mb-4 border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Eventos
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Informações Básicas */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>Dados principais do evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="nome"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Nome do Evento *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Ex: MDX25 - Mostra de Jogos e Robótica"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="descricao"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      handleInputChange("descricao", e.target.value)
                    }
                    placeholder="Descreva o evento, seus objetivos e público-alvo..."
                    className="mt-1 min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="dataInicio"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Data de Início *
                    </Label>
                    <Input
                      id="dataInicio"
                      type="datetime-local"
                      value={formData.dataInicio}
                      onChange={(e) =>
                        handleInputChange("dataInicio", e.target.value)
                      }
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="dataFim"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Data de Fim *
                    </Label>
                    <Input
                      id="dataFim"
                      type="datetime-local"
                      value={formData.dataFim}
                      onChange={(e) =>
                        handleInputChange("dataFim", e.target.value)
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) =>
                      handleInputChange("ativo", e.target.checked)
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Label
                    htmlFor="ativo"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Evento ativo para inscrições
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Modalidades */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      Modalidades
                    </CardTitle>
                    <CardDescription>
                      Configure as modalidades disponíveis para este evento
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addModalidade}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Modalidade
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modalidades.map((modalidade, index) => (
                    <div
                      key={modalidade.id}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          Modalidade {index + 1}
                        </h4>
                        {modalidades.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeModalidade(index)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Nome da Modalidade *
                          </Label>
                          <Input
                            value={modalidade.nome}
                            onChange={(e) =>
                              handleModalidadeChange(
                                index,
                                "nome",
                                e.target.value
                              )
                            }
                            placeholder="Ex: Jogos Digitais"
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-gray-700">
                            Limite de Vagas *
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={modalidade.limiteVagas}
                            onChange={(e) =>
                              handleModalidadeChange(
                                index,
                                "limiteVagas",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="Ex: 50"
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label className="text-sm font-semibold text-gray-700">
                          Descrição
                        </Label>
                        <Textarea
                          value={modalidade.descricao}
                          onChange={(e) =>
                            handleModalidadeChange(
                              index,
                              "descricao",
                              e.target.value
                            )
                          }
                          placeholder="Descreva esta modalidade..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {modalidades.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      Nenhuma modalidade adicionada ainda
                    </p>
                    <Button
                      type="button"
                      onClick={addModalidade}
                      variant="outline"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Modalidade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/eventos")}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Criar Evento
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function NovoEventoPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-poppins">Carregando...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function NovoEventoPageWrapper() {
  return (
    <Suspense fallback={<NovoEventoPageLoading />}>
      <NovoEventoPage />
    </Suspense>
  );
}

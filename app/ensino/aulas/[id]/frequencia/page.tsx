"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Users,
  GraduationCap,
  ArrowLeft,
  Search,
  Calendar,
  BookOpen,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  FileText,
  School,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Aula {
  id: string;
  titulo: string;
  descricao?: string;
  data_aula: string;
  carga_horaria: number;
  conteudo?: string;
  turma_id: string;
  created_at: string;
  turma?: {
    id: string;
    nome: string;
    curso?: {
      nome: string;
    };
  };
}

interface AlunaFrequencia {
  id: string;
  aluna_id: string;
  nome: string;
  email: string;
  presente: boolean;
  observacoes?: string;
}

export default function AulaFrequenciaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const monitorEmail = searchParams.get("email");
  const aulaId = params.id as string;

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [aula, setAula] = useState<Aula | null>(null);
  const [frequencias, setFrequencias] = useState<AlunaFrequencia[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isObservacaoModalOpen, setIsObservacaoModalOpen] = useState(false);
  const [selectedAluna, setSelectedAluna] = useState<AlunaFrequencia | null>(
    null
  );
  const [observacaoTemp, setObservacaoTemp] = useState("");

  const [editForm, setEditForm] = useState({
    titulo: "",
    descricao: "",
    data_aula: "",
    carga_horaria: "",
    conteudo: "",
  });

  // Verificar sessão existente
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { email, nome, role, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionTimeout = 30 * 60 * 1000; // 30 minutos

          if (now - timestamp < sessionTimeout) {
            setIsAuthenticated(true);
            setMonitorName(nome || "");
            setMonitorRole(role || "MONITOR");
            loadAulaData();
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      }

      // Se não há sessão válida, redirecionar para login
      router.push("/painel");
    };

    checkSession();
    setIsLoading(false);
  }, [router, aulaId]);

  const loadAulaData = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      // Carregar dados da aula
      const aulaResponse = await fetch(`/api/aulas/${aulaId}`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (aulaResponse.ok) {
        const aulaData = await aulaResponse.json();
        setAula(aulaData);
        setEditForm({
          titulo: aulaData.titulo,
          descricao: aulaData.descricao || "",
          data_aula: new Date(aulaData.data_aula).toISOString().slice(0, 16),
          carga_horaria: aulaData.carga_horaria.toString(),
          conteudo: aulaData.conteudo || "",
        });
      }

      // Carregar frequências
      loadFrequencias();
    } catch (error) {
      console.error("Erro ao carregar dados da aula:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da aula",
        variant: "destructive",
      });
    }
  };

  const loadFrequencias = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/aulas/${aulaId}/frequencias`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFrequencias(data);
      }
    } catch (error) {
      console.error("Erro ao carregar frequências:", error);
    }
  };

  const handleNavigateToModule = (module: string) => {
    if (monitorEmail) {
      router.push(`/${module}?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push(`/${module}`);
    }
  };

  const handleBack = () => {
    if (aula?.turma_id) {
      if (monitorEmail) {
        router.push(
          `/ensino/turmas/${aula.turma_id}?email=${encodeURIComponent(
            monitorEmail
          )}`
        );
      } else {
        router.push(`/ensino/turmas/${aula.turma_id}`);
      }
    } else {
      if (monitorEmail) {
        router.push(`/ensino/turmas?email=${encodeURIComponent(monitorEmail)}`);
      } else {
        router.push("/ensino/turmas");
      }
    }
  };

  const handleUpdateAula = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/aulas/${aulaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          titulo: editForm.titulo,
          descricao: editForm.descricao,
          data_aula: editForm.data_aula,
          carga_horaria: parseInt(editForm.carga_horaria),
          conteudo: editForm.conteudo,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Aula atualizada com sucesso",
          variant: "default",
        });
        setIsEditModalOpen(false);
        loadAulaData();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar aula",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar aula",
        variant: "destructive",
      });
    }
  };

  const handleTogglePresenca = async (alunaId: string, presente: boolean) => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(
        `/api/aulas/${aulaId}/frequencias/${alunaId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${email}`,
          },
          body: JSON.stringify({
            presente: presente,
          }),
        }
      );

      if (response.ok) {
        // Atualizar o estado local imediatamente
        setFrequencias((prev) =>
          prev.map((freq) =>
            freq.aluna_id === alunaId ? { ...freq, presente: presente } : freq
          )
        );

        toast({
          title: "Sucesso",
          description: `Presença ${
            presente ? "marcada" : "desmarcada"
          } com sucesso`,
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar presença",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar presença:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar presença",
        variant: "destructive",
      });
    }
  };

  const handleSalvarObservacao = async () => {
    if (!selectedAluna) return;

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(
        `/api/aulas/${aulaId}/frequencias/${selectedAluna.aluna_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${email}`,
          },
          body: JSON.stringify({
            observacoes: observacaoTemp,
          }),
        }
      );

      if (response.ok) {
        // Atualizar o estado local
        setFrequencias((prev) =>
          prev.map((freq) =>
            freq.aluna_id === selectedAluna.aluna_id
              ? { ...freq, observacoes: observacaoTemp }
              : freq
          )
        );

        toast({
          title: "Sucesso",
          description: "Observação salva com sucesso",
          variant: "default",
        });

        setIsObservacaoModalOpen(false);
        setSelectedAluna(null);
        setObservacaoTemp("");
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar observação",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar observação",
        variant: "destructive",
      });
    }
  };

  const openObservacaoModal = (aluna: AlunaFrequencia) => {
    setSelectedAluna(aluna);
    setObservacaoTemp(aluna.observacoes || "");
    setIsObservacaoModalOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  // Filtrar frequências
  const filteredFrequencias = frequencias.filter(
    (freq) =>
      freq.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freq.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalAlunas = frequencias.length;
  const presentes = frequencias.filter((f) => f.presente).length;
  const ausentes = totalAlunas - presentes;
  const percentualPresenca =
    totalAlunas > 0 ? Math.round((presentes / totalAlunas) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da aula...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aula não encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            A aula solicitada não existe ou você não tem permissão para
            acessá-la.
          </p>
          <Button onClick={handleBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header com navegação */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img
                src="/assets/images/md_logo.svg"
                alt="Mermãs Digitais"
                className="h-10 w-auto object-contain"
              />
              <div className="border-l border-gray-300 pl-3">
                <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {aula.titulo}
                </h1>
                <p className="text-xs text-gray-500">
                  {aula.turma?.nome} • {formatDateTime(aula.data_aula)}
                </p>
              </div>
            </div>

            {/* Navegação de Módulos */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium">
                    Módulos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <NavigationMenuLink asChild>
                        <div
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleNavigateToModule("matriculas")}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-r from-blue-100 to-blue-200">
                            <Users className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              Matrículas
                            </h3>
                            <p className="text-xs text-gray-500">
                              Gestão de inscrições e monitores
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-r from-green-100 to-green-200">
                            <GraduationCap className="h-5 w-5 text-green-700" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-green-900">
                              Ensino
                            </h3>
                            <p className="text-xs text-green-600">
                              Cursos, turmas, aulas e frequência
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Info do usuário */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {monitorName}
                </div>
                <div className="text-xs text-gray-500">
                  {monitorRole === "ADM" ? "Administrador" : "Monitor"}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-200 flex items-center justify-center">
                <span className="font-bold text-xs text-green-700">
                  {monitorName ? monitorName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header da Aula */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Informações da Aula */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-green-900 flex items-center gap-2">
                      <BookOpen className="w-6 h-6" />
                      {aula.titulo}
                    </CardTitle>
                    <CardDescription className="text-green-700 mt-2">
                      {aula.descricao || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-900">
                        {formatDateTime(aula.data_aula)}
                      </div>
                      <div className="text-xs text-green-600">Data e Hora</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-900">
                        {aula.carga_horaria}h
                      </div>
                      <div className="text-xs text-green-600">
                        Carga Horária
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-green-900">
                        {aula.turma?.nome}
                      </div>
                      <div className="text-xs text-green-600">Turma</div>
                    </div>
                  </div>
                </div>

                {aula.conteudo && (
                  <div className="mt-4 p-3 bg-white/50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Conteúdo Ministrado
                    </h4>
                    <p className="text-sm text-green-800">{aula.conteudo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas de Frequência */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {percentualPresenca}%
                    </div>
                    <div className="text-sm text-gray-600">Presença</div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentualPresenca}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {presentes}
                      </div>
                      <div className="text-xs text-gray-600">Presentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">
                        {ausentes}
                      </div>
                      <div className="text-xs text-gray-600">Ausentes</div>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t border-gray-200">
                    <div className="text-lg font-semibold text-gray-700">
                      {totalAlunas}
                    </div>
                    <div className="text-xs text-gray-600">Total de Alunas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de Frequência */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Controle de Frequência
                </CardTitle>
                <CardDescription>
                  Marque a presença das alunas na aula
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar alunas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredFrequencias.length > 0 ? (
                filteredFrequencias.map((freq) => (
                  <div
                    key={freq.aluna_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {freq.nome}
                      </h4>
                      <p className="text-sm text-gray-600">{freq.email}</p>
                      {freq.observacoes && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">
                            {freq.observacoes}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão de Observação */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openObservacaoModal(freq)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>

                      {/* Botões de Presença */}
                      <div className="flex bg-white border rounded-lg overflow-hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTogglePresenca(freq.aluna_id, true)
                          }
                          className={`px-3 ${
                            freq.presente
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "text-gray-600 hover:bg-green-50"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Presente
                        </Button>

                        <div className="w-px bg-gray-200"></div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleTogglePresenca(freq.aluna_id, false)
                          }
                          className={`px-3 ${
                            !freq.presente
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "text-gray-600 hover:bg-red-50"
                          }`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ausente
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma aluna encontrada
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Tente ajustar o filtro de busca"
                      : "Não há alunas vinculadas a esta turma"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Editar Aula */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
            <DialogDescription>
              Atualize as informações da aula
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-titulo">Título da Aula *</Label>
              <Input
                id="edit-titulo"
                value={editForm.titulo}
                onChange={(e) =>
                  setEditForm({ ...editForm, titulo: e.target.value })
                }
                placeholder="Ex: Introdução ao HTML"
              />
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={editForm.descricao}
                onChange={(e) =>
                  setEditForm({ ...editForm, descricao: e.target.value })
                }
                placeholder="Breve descrição da aula..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-data_aula">Data e Hora da Aula *</Label>
                <Input
                  id="edit-data_aula"
                  type="datetime-local"
                  value={editForm.data_aula}
                  onChange={(e) =>
                    setEditForm({ ...editForm, data_aula: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-carga_horaria">
                  Carga Horária (horas) *
                </Label>
                <Input
                  id="edit-carga_horaria"
                  type="number"
                  value={editForm.carga_horaria}
                  onChange={(e) =>
                    setEditForm({ ...editForm, carga_horaria: e.target.value })
                  }
                  placeholder="2"
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-conteudo">Conteúdo Ministrado</Label>
              <Textarea
                id="edit-conteudo"
                value={editForm.conteudo}
                onChange={(e) =>
                  setEditForm({ ...editForm, conteudo: e.target.value })
                }
                placeholder="Descreva o conteúdo abordado na aula..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateAula}
              disabled={
                !editForm.titulo ||
                !editForm.data_aula ||
                !editForm.carga_horaria
              }
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Observação */}
      <Dialog
        open={isObservacaoModalOpen}
        onOpenChange={setIsObservacaoModalOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Observação - {selectedAluna?.nome}</DialogTitle>
            <DialogDescription>
              Adicione observações sobre a participação da aluna na aula
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacaoTemp}
              onChange={(e) => setObservacaoTemp(e.target.value)}
              placeholder="Ex: Aluna chegou atrasada, mas participou ativamente da aula..."
              rows={4}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsObservacaoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarObservacao}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Observação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

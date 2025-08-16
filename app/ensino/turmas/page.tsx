"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModuleHeader } from "@/components/module-header";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  ArrowLeft,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen,
  User,
  Clock,
  ChevronRight,
  Shuffle,
  Filter,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Curso {
  id: string;
  nome_curso: string;
  descricao?: string;
  carga_horaria: number;
  publico_alvo?: string;
  status: "ativo" | "inativo";
  projeto: "Meninas STEM" | "Mermãs Digitais";
  created_at: string;
}

interface Turma {
  id: string;
  codigo_turma: string;
  descricao?: string;
  curso_id: string;
  ano_letivo: string;
  semestre: number;
  status: "Planejamento" | "Ativa" | "Concluída";
  created_at: string;
  updated_at: string;
  cursos?: Curso;
}

export default function TurmasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredTurmas, setFilteredTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurso, setFilterCurso] = useState<string>("all");
  const [filterAno, setFilterAno] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);

  const [formData, setFormData] = useState({
    codigo_turma: "",
    descricao: "",
    curso_id: "",
    ano_letivo: new Date().getFullYear().toString(),
    semestre: "1",
    status: "Planejamento" as "Planejamento" | "Ativa" | "Concluída",
  });

  // Gerar lista de anos letivos de 2020 até o ano atual
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  // Função para gerar código automático da turma
  const generateTurmaCode = () => {
    if (!formData.curso_id || !formData.ano_letivo || !formData.semestre) {
      toast({
        title: "Atenção",
        description: "Selecione o curso, ano letivo e semestre primeiro",
        variant: "destructive",
      });
      return;
    }

    const curso = cursos.find((c) => c.id === formData.curso_id);
    if (!curso) return;

    // Prefixo baseado no projeto
    const prefixo = curso.projeto === "Meninas STEM" ? "MS" : "MD";

    // Gerar sufixo aleatório de 3 dígitos
    const sufixo = Math.floor(100 + Math.random() * 900);

    // Formato: PREFIXO + SUFIXO + ANO + SEMESTRE
    // Exemplo: MD543-2024.1 ou MS789-2024.2
    const codigo = `${prefixo}${sufixo}-${formData.ano_letivo}.${formData.semestre}`;

    setFormData((prev) => ({
      ...prev,
      codigo_turma: codigo,
    }));

    toast({
      title: "Código gerado!",
      description: `Código da turma: ${codigo}`,
      variant: "default",
    });
  };

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
            loadTurmas();
            loadCursos();
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
  }, [router]);

  const loadTurmas = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch("/api/turmas", {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        setTurmas(data);
        setFilteredTurmas(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar turmas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar turmas",
        variant: "destructive",
      });
    }
  };

  const loadCursos = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch("/api/cursos", {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        setCursos(data.filter((curso: Curso) => curso.status === "ativo"));
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos",
        variant: "destructive",
      });
    }
  };

  // Filtrar turmas
  useEffect(() => {
    let filtered = turmas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (turma) =>
          turma.codigo_turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turma.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turma.cursos?.nome_curso
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por curso
    if (filterCurso !== "all") {
      filtered = filtered.filter((turma) => turma.curso_id === filterCurso);
    }

    // Filtro por ano letivo
    if (filterAno !== "all") {
      filtered = filtered.filter(
        (turma) => turma.ano_letivo.toString() === filterAno
      );
    }

    // Filtro por status
    if (filterStatus !== "all") {
      filtered = filtered.filter((turma) => turma.status === filterStatus);
    }

    setFilteredTurmas(filtered);
  }, [turmas, searchTerm, filterCurso, filterAno, filterStatus]);

  const handleNavigateToModule = (module: string) => {
    if (monitorEmail) {
      router.push(`/${module}?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push(`/${module}`);
    }
  };

  const handleBack = () => {
    if (monitorEmail) {
      router.push(`/ensino?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push("/ensino");
    }
  };

  const handleTurmaClick = (turmaId: string) => {
    if (monitorEmail) {
      router.push(
        `/ensino/turmas/${turmaId}?email=${encodeURIComponent(monitorEmail)}`
      );
    } else {
      router.push(`/ensino/turmas/${turmaId}`);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_turma: "",
      descricao: "",
      curso_id: "",
      ano_letivo: new Date().getFullYear().toString(),
      semestre: "1",
      status: "Planejamento" as const,
    });
    setEditingTurma(null);
  };

  const handleCreateTurma = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch("/api/turmas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          ...formData,
          ano_letivo: parseInt(formData.ano_letivo),
          semestre: parseInt(formData.semestre),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Turma criada com sucesso",
          variant: "default",
        });
        setIsCreateModalOpen(false);
        resetForm();
        loadTurmas();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar turma",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar turma",
        variant: "destructive",
      });
    }
  };

  const handleEditTurma = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      codigo_turma: turma.codigo_turma || "",
      descricao: turma.descricao || "",
      curso_id: turma.curso_id,
      ano_letivo: turma.ano_letivo.toString(),
      semestre: turma.semestre.toString(),
      status: turma.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTurma = async () => {
    if (!editingTurma) return;

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${editingTurma.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          ...formData,
          ano_letivo: parseInt(formData.ano_letivo),
          semestre: parseInt(formData.semestre),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso",
          variant: "default",
        });
        setIsEditModalOpen(false);
        resetForm();
        loadTurmas();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar turma",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar turma",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTurma = async (turma: Turma) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a turma "${turma.codigo_turma}"?`
      )
    ) {
      return;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turma.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Turma excluída com sucesso",
          variant: "default",
        });
        loadTurmas();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao excluir turma",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir turma",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando turmas...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ModuleHeader
        moduleName="Turmas"
        moduleDescription="Gerencie as turmas dos cursos do projeto."
        moduleIcon={GraduationCap}
        gradientFrom="from-blue-500"
        gradientTo="to-purple-600"
        iconColor="text-blue-300"
      />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Actions Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Turmas Disponíveis
            </h2>
            <p className="text-gray-600 mt-1">
              Gerencie e organize as turmas da plataforma
            </p>
          </div>
          {monitorRole === "ADM" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Turma
            </Button>
          )}
        </div>
        {/* Filtros */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-white via-blue-50/20 to-purple-50/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Filtros de Busca
                </h3>
                <p className="text-sm text-gray-600">
                  Encontre exatamente o que procura
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Busca Geral
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por código, descrição ou curso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Curso
                </Label>
                <Select value={filterCurso} onValueChange={setFilterCurso}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Todos os cursos" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Todos os cursos</SelectItem>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nome_curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ano Letivo
                </Label>
                <Select value={filterAno} onValueChange={setFilterAno}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>{" "}
        {/* Lista de turmas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurmas.map((turma) => (
            <Card
              key={turma.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 border-l-blue-400"
              onClick={() => handleTurmaClick(turma.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {turma.codigo_turma}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        {turma.cursos?.nome_curso || "Curso não encontrado"}
                      </Badge>
                      {turma.status === "Ativa" ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Ativa
                        </Badge>
                      ) : turma.status === "Planejamento" ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Planejamento
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          Concluída
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {monitorRole === "ADM" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTurma(turma);
                          }}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTurma(turma);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {turma.descricao && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {turma.descricao}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {turma.ano_letivo}/{turma.semestre}º sem
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Criada em {formatDate(turma.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredTurmas.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma turma encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ||
                filterCurso !== "all" ||
                filterAno !== "all" ||
                filterStatus !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Crie a primeira turma para começar."}
              </p>
              {monitorRole === "ADM" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeira Turma
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Criar Nova Turma
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da nova turma. O código será gerado
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="curso_id" className="text-sm font-medium">
                Curso *
              </Label>
              <Select
                value={formData.curso_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, curso_id: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      <div className="flex flex-col">
                        <span>{curso.nome_curso}</span>
                        <span className="text-xs text-gray-500">
                          {curso.projeto}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="codigo_turma" className="text-sm font-medium">
                Código da Turma
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="codigo_turma"
                  value={formData.codigo_turma}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_turma: e.target.value })
                  }
                  placeholder="Ex: MD123-2024.1"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateTurmaCode}
                  className="shrink-0"
                >
                  <Shuffle className="w-4 h-4 mr-1" />
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecione o curso primeiro para gerar um código automático
              </p>
            </div>

            <div>
              <Label htmlFor="descricao" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a turma (opcional)..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ano_letivo" className="text-sm font-medium">
                  Ano Letivo *
                </Label>
                <Select
                  value={formData.ano_letivo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ano_letivo: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semestre" className="text-sm font-medium">
                  Semestre *
                </Label>
                <Select
                  value={formData.semestre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semestre: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Semestre</SelectItem>
                    <SelectItem value="2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === "Ativa"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "Ativa" : "Planejamento",
                  })
                }
              />
              <Label htmlFor="status" className="text-sm font-medium">
                Turma ativa
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTurma}
              disabled={!formData.codigo_turma || !formData.curso_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Turma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Turma
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da turma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label
                htmlFor="edit-codigo_turma"
                className="text-sm font-medium"
              >
                Código da Turma *
              </Label>
              <Input
                id="edit-codigo_turma"
                value={formData.codigo_turma}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_turma: e.target.value })
                }
                placeholder="Ex: MD123-2024.1"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-curso_id" className="text-sm font-medium">
                Curso *
              </Label>
              <Select
                value={formData.curso_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, curso_id: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      <div className="flex flex-col">
                        <span>{curso.nome_curso}</span>
                        <span className="text-xs text-gray-500">
                          {curso.projeto}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-descricao" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a turma (opcional)..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="edit-ano_letivo"
                  className="text-sm font-medium"
                >
                  Ano Letivo *
                </Label>
                <Select
                  value={formData.ano_letivo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ano_letivo: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-semestre" className="text-sm font-medium">
                  Semestre *
                </Label>
                <Select
                  value={formData.semestre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semestre: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Semestre</SelectItem>
                    <SelectItem value="2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-status"
                checked={formData.status === "Ativa"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "Ativa" : "Planejamento",
                  })
                }
              />
              <Label htmlFor="edit-status" className="text-sm font-medium">
                Turma ativa
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateTurma}
              disabled={!formData.codigo_turma || !formData.curso_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Atualizar Turma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

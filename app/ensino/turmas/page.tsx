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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  carga_horaria: number;
  nivel: "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
  ativo: boolean;
}

interface Turma {
  id: string;
  nome: string;
  descricao?: string;
  curso_id: string;
  ano_letivo: number;
  semestre: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  curso?: Curso;
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
    nome: "",
    descricao: "",
    curso_id: "",
    ano_letivo: new Date().getFullYear().toString(),
    semestre: "1",
    ativa: true,
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
        setCursos(data.filter((curso: Curso) => curso.ativo));
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    }
  };

  // Filtrar turmas
  useEffect(() => {
    let filtered = turmas;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (turma) =>
          turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turma.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turma.curso?.nome.toLowerCase().includes(searchTerm.toLowerCase())
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
      filtered = filtered.filter((turma) =>
        filterStatus === "ativa" ? turma.ativa : !turma.ativa
      );
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
      nome: "",
      descricao: "",
      curso_id: "",
      ano_letivo: new Date().getFullYear().toString(),
      semestre: "1",
      ativa: true,
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
      nome: turma.nome,
      descricao: turma.descricao || "",
      curso_id: turma.curso_id,
      ano_letivo: turma.ano_letivo.toString(),
      semestre: turma.semestre.toString(),
      ativa: turma.ativa,
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
    if (!confirm(`Tem certeza que deseja excluir a turma "${turma.nome}"?`)) {
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

  // Gerar anos para o filtro
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando turmas...</p>
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
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Gestão de Turmas
                </h1>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 flex items-center justify-center">
                <span className="font-bold text-xs text-blue-700">
                  {monitorName ? monitorName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Gestão de Turmas
            </h2>
            <p className="text-gray-600 mt-1">
              Organize e gerencie as turmas dos cursos
            </p>
          </div>
          {monitorRole === "ADM" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar turmas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCurso} onValueChange={setFilterCurso}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="inativa">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Turmas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurmas.map((turma) => (
            <Card
              key={turma.id}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleTurmaClick(turma.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {turma.nome}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        {turma.curso?.nome || "Curso não encontrado"}
                      </Badge>
                      {turma.ativa ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativa
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
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ||
              filterCurso !== "all" ||
              filterAno !== "all" ||
              filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Não há turmas cadastradas ainda"}
            </p>
            {monitorRole === "ADM" &&
              !searchTerm &&
              filterCurso === "all" &&
              filterAno === "all" &&
              filterStatus === "all" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              )}
          </Card>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Turma</DialogTitle>
            <DialogDescription>
              Preencha as informações da nova turma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Turma *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Turma A - Manhã"
              />
            </div>

            <div>
              <Label htmlFor="curso_id">Curso *</Label>
              <Select
                value={formData.curso_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, curso_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a turma..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                <Select
                  value={formData.ano_letivo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ano_letivo: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="semestre">Semestre *</Label>
                <Select
                  value={formData.semestre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semestre: value })
                  }
                >
                  <SelectTrigger>
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
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativa: checked })
                }
              />
              <Label htmlFor="ativa">Turma ativa</Label>
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
              disabled={!formData.nome || !formData.curso_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Criar Turma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>
              Atualize as informações da turma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Turma *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Turma A - Manhã"
              />
            </div>

            <div>
              <Label htmlFor="edit-curso_id">Curso *</Label>
              <Select
                value={formData.curso_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, curso_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva a turma..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-ano_letivo">Ano Letivo *</Label>
                <Select
                  value={formData.ano_letivo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ano_letivo: value })
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="edit-semestre">Semestre *</Label>
                <Select
                  value={formData.semestre}
                  onValueChange={(value) =>
                    setFormData({ ...formData, semestre: value })
                  }
                >
                  <SelectTrigger>
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
                id="edit-ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativa: checked })
                }
              />
              <Label htmlFor="edit-ativa">Turma ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateTurma}
              disabled={!formData.nome || !formData.curso_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

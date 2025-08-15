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
  DialogTrigger,
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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  carga_horaria: number;
  nivel: "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function CursosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    carga_horaria: "",
    nivel: "INICIANTE" as "INICIANTE" | "INTERMEDIARIO" | "AVANCADO",
    ativo: true,
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
        const data = await response.json();
        setCursos(data);
        setFilteredCursos(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar cursos",
          variant: "destructive",
        });
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

  // Filtrar cursos
  useEffect(() => {
    let filtered = cursos;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (curso) =>
          curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          curso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por nível
    if (filterLevel !== "all") {
      filtered = filtered.filter((curso) => curso.nivel === filterLevel);
    }

    // Filtro por status
    if (filterStatus !== "all") {
      filtered = filtered.filter((curso) =>
        filterStatus === "ativo" ? curso.ativo : !curso.ativo
      );
    }

    setFilteredCursos(filtered);
  }, [cursos, searchTerm, filterLevel, filterStatus]);

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

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      carga_horaria: "",
      nivel: "INICIANTE",
      ativo: true,
    });
    setEditingCurso(null);
  };

  const handleCreateCurso = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch("/api/cursos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          ...formData,
          carga_horaria: parseInt(formData.carga_horaria),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Curso criado com sucesso",
          variant: "default",
        });
        setIsCreateModalOpen(false);
        resetForm();
        loadCursos();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar curso",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar curso:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar curso",
        variant: "destructive",
      });
    }
  };

  const handleEditCurso = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      nome: curso.nome,
      descricao: curso.descricao || "",
      carga_horaria: curso.carga_horaria.toString(),
      nivel: curso.nivel,
      ativo: curso.ativo,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCurso = async () => {
    if (!editingCurso) return;

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/cursos/${editingCurso.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          ...formData,
          carga_horaria: parseInt(formData.carga_horaria),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Curso atualizado com sucesso",
          variant: "default",
        });
        setIsEditModalOpen(false);
        resetForm();
        loadCursos();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar curso",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar curso:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar curso",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCurso = async (curso: Curso) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${curso.nome}"?`)) {
      return;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/cursos/${curso.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Curso excluído com sucesso",
          variant: "default",
        });
        loadCursos();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao excluir curso",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir curso",
        variant: "destructive",
      });
    }
  };

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case "INICIANTE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Iniciante
          </Badge>
        );
      case "INTERMEDIARIO":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Intermediário
          </Badge>
        );
      case "AVANCADO":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Avançado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {nivel}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cursos...</p>
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
                <h1 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Gestão de Cursos
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
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              Gestão de Cursos
            </h2>
            <p className="text-gray-600 mt-1">
              Configure e administre os cursos disponíveis
            </p>
          </div>
          {monitorRole === "ADM" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Curso
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="INICIANTE">Iniciante</SelectItem>
                  <SelectItem value="INTERMEDIARIO">Intermediário</SelectItem>
                  <SelectItem value="AVANCADO">Avançado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cursos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCursos.map((curso) => (
            <Card key={curso.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 mb-2">
                      {curso.nome}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getNivelBadge(curso.nivel)}
                      {curso.ativo ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                  {monitorRole === "ADM" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCurso(curso)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCurso(curso)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {curso.descricao && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {curso.descricao}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{curso.carga_horaria}h de carga horária</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em {formatDate(curso.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCursos.length === 0 && (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterLevel !== "all" || filterStatus !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Não há cursos cadastrados ainda"}
            </p>
            {monitorRole === "ADM" &&
              !searchTerm &&
              filterLevel === "all" &&
              filterStatus === "all" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
          </Card>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo curso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Curso *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Programação Básica"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva o curso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carga_horaria">Carga Horária (horas) *</Label>
                <Input
                  id="carga_horaria"
                  type="number"
                  value={formData.carga_horaria}
                  onChange={(e) =>
                    setFormData({ ...formData, carga_horaria: e.target.value })
                  }
                  placeholder="40"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="nivel">Nível *</Label>
                <Select
                  value={formData.nivel}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, nivel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INICIANTE">Iniciante</SelectItem>
                    <SelectItem value="INTERMEDIARIO">Intermediário</SelectItem>
                    <SelectItem value="AVANCADO">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label htmlFor="ativo">Curso ativo</Label>
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
              onClick={handleCreateCurso}
              disabled={!formData.nome || !formData.carga_horaria}
              className="bg-green-600 hover:bg-green-700"
            >
              Criar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Atualize as informações do curso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome do Curso *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Programação Básica"
              />
            </div>

            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva o curso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-carga_horaria">
                  Carga Horária (horas) *
                </Label>
                <Input
                  id="edit-carga_horaria"
                  type="number"
                  value={formData.carga_horaria}
                  onChange={(e) =>
                    setFormData({ ...formData, carga_horaria: e.target.value })
                  }
                  placeholder="40"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="edit-nivel">Nível *</Label>
                <Select
                  value={formData.nivel}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, nivel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INICIANTE">Iniciante</SelectItem>
                    <SelectItem value="INTERMEDIARIO">Intermediário</SelectItem>
                    <SelectItem value="AVANCADO">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label htmlFor="edit-ativo">Curso ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCurso}
              disabled={!formData.nome || !formData.carga_horaria}
              className="bg-green-600 hover:bg-green-700"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

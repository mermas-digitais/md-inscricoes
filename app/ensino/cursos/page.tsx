"use client";

// Evita prerender estático que tenta resolver hooks de navegação no servidor
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/module-header";
import { SESSION_TIMEOUT } from "@/lib/constants/session";

interface Curso {
  id: string;
  nome_curso: string;
  descricao?: string;
  carga_horaria: number;
  publico_alvo: "Ensino Fundamental 2" | "Ensino Médio" | null;
  status: "ativo" | "inativo";
  projeto: "Meninas STEM" | "Mermãs Digitais";
  created_at: string;
}

function CursosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");
  const { toast } = useToast();

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filteredCursos, setFilteredCursos] = useState<Curso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublicoAlvo, setFilterPublicoAlvo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProjeto, setFilterProjeto] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [deletingCurso, setDeletingCurso] = useState<Curso | null>(null);

  const [formData, setFormData] = useState({
    nome_curso: "",
    descricao: "",
    carga_horaria: "",
    publico_alvo: "Ensino Fundamental 2" as
      | "Ensino Fundamental 2"
      | "Ensino Médio",
    status: "ativo" as "ativo" | "inativo",
    projeto: "Mermãs Digitais" as "Meninas STEM" | "Mermãs Digitais",
  });

  // Verificar sessão existente
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem("monitorSession");
      if (sessionData) {
        try {
          const { email, nome, role, timestamp } = JSON.parse(sessionData);
          const now = Date.now();

          if (now - timestamp < SESSION_TIMEOUT) {
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
        const result = await response.json();
        const cursosData = result.data || [];
        setCursos(cursosData);
        setFilteredCursos(cursosData);
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
  // Filtrar cursos
  useEffect(() => {
    let filtered = cursos;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (curso) =>
          curso.nome_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
          curso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por público alvo
    if (filterPublicoAlvo !== "all") {
      filtered = filtered.filter(
        (curso) => curso.publico_alvo === filterPublicoAlvo
      );
    }

    // Filtro por status
    if (filterStatus !== "all") {
      filtered = filtered.filter((curso) => curso.status === filterStatus);
    }

    // Filtro por projeto
    if (filterProjeto !== "all") {
      filtered = filtered.filter((curso) => curso.projeto === filterProjeto);
    }

    setFilteredCursos(filtered);
  }, [cursos, searchTerm, filterPublicoAlvo, filterStatus, filterProjeto]);

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
      nome_curso: "",
      descricao: "",
      carga_horaria: "",
      publico_alvo: "Ensino Fundamental 2",
      status: "ativo",
      projeto: "Mermãs Digitais",
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
          title: "Curso criado com sucesso!",
          description: `O curso "${formData.nome_curso}" foi adicionado à plataforma.`,
          variant: "success",
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
      nome_curso: curso.nome_curso,
      descricao: curso.descricao || "",
      carga_horaria: curso.carga_horaria.toString(),
      publico_alvo: curso.publico_alvo || "Ensino Fundamental 2",
      status: curso.status || "ativo",
      projeto: curso.projeto || "Mermãs Digitais",
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
          title: "Curso atualizado com sucesso!",
          description: `As alterações no curso "${formData.nome_curso}" foram salvas.`,
          variant: "success",
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

  const handleDeleteCurso = (curso: Curso) => {
    setDeletingCurso(curso);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCurso = async () => {
    if (!deletingCurso) return;

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/cursos/${deletingCurso.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Curso excluído com sucesso!",
          description: `O curso "${deletingCurso.nome_curso}" foi removido da plataforma.`,
          variant: "success",
        });
        setIsDeleteModalOpen(false);
        setDeletingCurso(null);
        loadCursos();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao excluir",
          description: error.error || "Não foi possível excluir o curso",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao excluir o curso",
        variant: "destructive",
      });
    }
  };

  const getPublicoAlvoBadge = (publico_alvo: string | null) => {
    switch (publico_alvo) {
      case "Ensino Fundamental 2":
        return (
          <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 font-semibold px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3" />
            Fundamental 2
          </Badge>
        );
      case "Ensino Médio":
        return (
          <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 font-semibold px-3 py-1.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Ensino Médio
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 font-medium px-3 py-1.5 shadow-sm flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            Não definido
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
      {/* ModuleHeader */}
      <ModuleHeader
        moduleName="Gestão de Cursos"
        moduleDescription="Configure e administre os cursos disponíveis"
        moduleIcon={BookOpen}
        gradientFrom="from-green-500"
        gradientTo="to-emerald-600"
        iconColor="text-green-300"
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
        {/* Reduzido padding top */}
        {/* Actions Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Cursos Disponíveis
            </h2>
            <p className="text-gray-600 mt-1">
              Gerencie e organize os cursos da plataforma
            </p>
          </div>
          {monitorRole === "ADM" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Curso
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-white via-green-50/20 to-emerald-50/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <Filter className="w-5 h-5 text-green-600" />
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
                    placeholder="Buscar por nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Público Alvo
                </Label>
                <Select
                  value={filterPublicoAlvo}
                  onValueChange={setFilterPublicoAlvo}
                >
                  <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                    <SelectValue placeholder="Filtrar por público" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">Todos os públicos</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="Ensino Fundamental 2"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          Ensino Fundamental 2
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Ensino Médio" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="font-medium">Ensino Médio</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">Todos os status</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ativo" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="font-medium">Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inativo" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="font-medium">Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Projeto
                </Label>
                <Select value={filterProjeto} onValueChange={setFilterProjeto}>
                  <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                    <SelectValue placeholder="Filtrar por projeto" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">Todos os projetos</span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="Mermãs Digitais"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="font-medium">Mermãs Digitais</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Meninas STEM" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-pink-600" />
                        </div>
                        <span className="font-medium">Meninas STEM</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results counter */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-green-600">
                  {filteredCursos.length}
                </span>
                {filteredCursos.length === 1
                  ? " curso encontrado"
                  : " cursos encontrados"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Cursos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCursos.map((curso) => (
            <Card
              key={curso.id}
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2 group-hover:from-green-600 group-hover:to-emerald-500 transition-all duration-300">
                      {curso.nome_curso}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getPublicoAlvoBadge(curso.publico_alvo)}
                    </div>
                  </div>
                  {monitorRole === "ADM" && (
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCurso(curso)}
                        className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCurso(curso)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {curso.descricao && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {curso.descricao}
                  </p>
                )}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium">
                      {curso.carga_horaria}h de carga horária
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">
                      Criado em {formatDate(curso.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>

              {/* Decorative gradient line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Card>
          ))}
        </div>

        {filteredCursos.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              {searchTerm ||
              filterPublicoAlvo !== "all" ||
              filterStatus !== "all" ||
              filterProjeto !== "all"
                ? "Tente ajustar os filtros de busca para encontrar o que procura"
                : "Não há cursos cadastrados ainda. Que tal criar o primeiro?"}
            </p>
            {monitorRole === "ADM" &&
              !searchTerm &&
              filterPublicoAlvo === "all" &&
              filterStatus === "all" &&
              filterProjeto === "all" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
          </Card>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Criar Novo Curso
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Preencha as informações para criar um novo curso na plataforma
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label
                htmlFor="nome_curso"
                className="text-sm font-semibold text-gray-700"
              >
                Nome do Curso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome_curso"
                value={formData.nome_curso}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, nome_curso: e.target.value })
                }
                placeholder="Ex: Programação Básica em Python"
                className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="descricao"
                className="text-sm font-semibold text-gray-700"
              >
                Descrição do Curso
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva os objetivos, conteúdo e metodologia do curso..."
                rows={4}
                className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="carga_horaria"
                  className="text-sm font-semibold text-gray-700"
                >
                  Carga Horária <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="carga_horaria"
                    type="number"
                    value={formData.carga_horaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        carga_horaria: e.target.value,
                      })
                    }
                    placeholder="40"
                    min="1"
                    max="1000"
                    className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                    horas
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="publico_alvo"
                  className="text-sm font-semibold text-gray-700"
                >
                  Público Alvo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.publico_alvo}
                  onValueChange={(
                    value: "Ensino Fundamental 2" | "Ensino Médio"
                  ) => setFormData({ ...formData, publico_alvo: value })}
                >
                  <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                    <SelectValue placeholder="Selecione o público alvo" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem
                      value="Ensino Fundamental 2"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          Ensino Fundamental 2
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Ensino Médio" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="font-medium">Ensino Médio</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-sm font-semibold text-gray-700"
              >
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "ativo" | "inativo") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="ativo" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="font-medium">Ativo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inativo" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="font-medium">Inativo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="projeto"
                className="text-sm font-semibold text-gray-700"
              >
                Projeto <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.projeto}
                onValueChange={(value: "Meninas STEM" | "Mermãs Digitais") =>
                  setFormData({ ...formData, projeto: value })
                }
              >
                <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem
                    value="Mermãs Digitais"
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="font-medium">Mermãs Digitais</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Meninas STEM" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-pink-600" />
                      </div>
                      <span className="font-medium">Meninas STEM</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCurso}
              disabled={
                !formData.nome_curso ||
                !formData.carga_horaria ||
                !formData.publico_alvo ||
                !formData.status ||
                !formData.projeto
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Editar Curso
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Atualize as informações do curso selecionado
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label
                htmlFor="edit-nome_curso"
                className="text-sm font-semibold text-gray-700"
              >
                Nome do Curso <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-nome_curso"
                value={formData.nome_curso}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, nome_curso: e.target.value })
                }
                placeholder="Ex: Programação Básica em Python"
                className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-descricao"
                className="text-sm font-semibold text-gray-700"
              >
                Descrição do Curso
              </Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva os objetivos, conteúdo e metodologia do curso..."
                rows={4}
                className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-carga_horaria"
                  className="text-sm font-semibold text-gray-700"
                >
                  Carga Horária <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="edit-carga_horaria"
                    type="number"
                    value={formData.carga_horaria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        carga_horaria: e.target.value,
                      })
                    }
                    placeholder="40"
                    min="1"
                    max="1000"
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                    horas
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-publico_alvo"
                  className="text-sm font-semibold text-gray-700"
                >
                  Público Alvo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.publico_alvo}
                  onValueChange={(
                    value: "Ensino Fundamental 2" | "Ensino Médio"
                  ) => setFormData({ ...formData, publico_alvo: value })}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Selecione o público alvo" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem
                      value="Ensino Fundamental 2"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          Ensino Fundamental 2
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Ensino Médio" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="font-medium">Ensino Médio</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-status"
                  className="text-sm font-semibold text-gray-700"
                >
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "ativo" | "inativo") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="ativo" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="font-medium">Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inativo" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="w-3 h-3 text-red-600" />
                        </div>
                        <span className="font-medium">Inativo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-projeto"
                  className="text-sm font-semibold text-gray-700"
                >
                  Projeto <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.projeto}
                  onValueChange={(value: "Meninas STEM" | "Mermãs Digitais") =>
                    setFormData({ ...formData, projeto: value })
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200">
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem
                      value="Mermãs Digitais"
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="font-medium">Mermãs Digitais</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Meninas STEM" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-pink-600" />
                        </div>
                        <span className="font-medium">Meninas STEM</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCurso}
              disabled={
                !formData.nome_curso ||
                !formData.carga_horaria ||
                !formData.publico_alvo ||
                !formData.status ||
                !formData.projeto
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Esta ação não pode ser desfeita
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Atenção!</h4>
                  <p className="text-sm text-red-700">
                    Ao excluir este curso, todas as informações relacionadas
                    serão permanentemente removidas.
                  </p>
                </div>
              </div>
            </div>

            {deletingCurso && (
              <div className="space-y-3">
                <p className="text-gray-700">
                  Você está prestes a excluir o seguinte curso:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {deletingCurso.nome_curso}
                  </h4>
                  {deletingCurso.descricao && (
                    <p className="text-sm text-gray-600 mb-2">
                      {deletingCurso.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {deletingCurso.carga_horaria}h
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {deletingCurso.publico_alvo}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingCurso(null);
              }}
              className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteCurso}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading component for Suspense
function CursosPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando cursos...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function CursosPageWrapper() {
  return (
    <Suspense fallback={<CursosPageLoading />}>
      <CursosPage />
    </Suspense>
  );
}

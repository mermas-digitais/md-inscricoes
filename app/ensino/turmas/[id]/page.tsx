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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Trash2,
  GraduationCap,
  ArrowLeft,
  Search,
  Calendar,
  BookOpen,
  User,
  Clock,
  UserPlus,
  UserMinus,
  Monitor,
  School,
  Edit,
  FileText,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Turma {
  id: string;
  nome: string;
  descricao?: string;
  curso_id: string;
  ano_letivo: number;
  semestre: number;
  ativa: boolean;
  created_at: string;
  curso?: {
    id: string;
    nome: string;
    descricao?: string;
    carga_horaria: number;
    nivel: string;
  };
}

interface Aluna {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  curso: string;
  status: string;
  created_at: string;
}

interface Monitor {
  id: string;
  nome: string;
  email: string;
  role: string;
  created_at: string;
}

interface Aula {
  id: string;
  titulo: string;
  descricao?: string;
  data_aula: string;
  carga_horaria: number;
  conteudo?: string;
  created_at: string;
}

export default function TurmaDetalhesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const monitorEmail = searchParams.get("email");
  const turmaId = params.id as string;

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunas, setAlunas] = useState<Aluna[]>([]);
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [searchAlunas, setSearchAlunas] = useState("");
  const [searchMonitores, setSearchMonitores] = useState("");
  const [searchAulas, setSearchAulas] = useState("");

  const [isVincularAlunaModalOpen, setIsVincularAlunaModalOpen] =
    useState(false);
  const [isVincularMonitorModalOpen, setIsVincularMonitorModalOpen] =
    useState(false);
  const [isNovaAulaModalOpen, setIsNovaAulaModalOpen] = useState(false);

  const [alunasCandidatas, setAlunasCandidatas] = useState<Aluna[]>([]);
  const [monitoresCandidatos, setMonitoresCandidatos] = useState<Monitor[]>([]);

  const [novaAulaForm, setNovaAulaForm] = useState({
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
            loadTurmaDetails();
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
  }, [router, turmaId]);

  const loadTurmaDetails = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      // Carregar dados da turma
      const turmaResponse = await fetch(`/api/turmas/${turmaId}`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (turmaResponse.ok) {
        const turmaData = await turmaResponse.json();
        setTurma(turmaData);
      }

      // Carregar alunas vinculadas
      loadAlunas();

      // Carregar monitores vinculados (apenas para ADM)
      if (monitorRole === "ADM") {
        loadMonitores();
      }

      // Carregar aulas
      loadAulas();
    } catch (error) {
      console.error("Erro ao carregar detalhes da turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes da turma",
        variant: "destructive",
      });
    }
  };

  const loadAlunas = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/alunas`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlunas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar alunas:", error);
    }
  };

  const loadMonitores = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/monitores`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMonitores(data);
      }
    } catch (error) {
      console.error("Erro ao carregar monitores:", error);
    }
  };

  const loadAulas = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/aulas`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAulas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar aulas:", error);
    }
  };

  const loadAlunasCandidatas = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/alunas/candidatas`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlunasCandidatas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar alunas candidatas:", error);
    }
  };

  const loadMonitoresCandidatos = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(
        `/api/turmas/${turmaId}/monitores/candidatos`,
        {
          headers: {
            Authorization: `Bearer ${email}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMonitoresCandidatos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar monitores candidatos:", error);
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
    if (monitorEmail) {
      router.push(`/ensino/turmas?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push("/ensino/turmas");
    }
  };

  const handleVincularAluna = async (alunaId: string) => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/alunas/${alunaId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Aluna vinculada à turma com sucesso",
          variant: "default",
        });
        loadAlunas();
        setIsVincularAlunaModalOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao vincular aluna",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao vincular aluna:", error);
      toast({
        title: "Erro",
        description: "Erro ao vincular aluna",
        variant: "destructive",
      });
    }
  };

  const handleDesvincularAluna = async (alunaId: string) => {
    if (!confirm("Tem certeza que deseja desvincular esta aluna da turma?")) {
      return;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(`/api/turmas/${turmaId}/alunas/${alunaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Aluna desvinculada da turma com sucesso",
          variant: "default",
        });
        loadAlunas();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao desvincular aluna",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao desvincular aluna:", error);
      toast({
        title: "Erro",
        description: "Erro ao desvincular aluna",
        variant: "destructive",
      });
    }
  };

  const handleVincularMonitor = async (monitorId: string) => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(
        `/api/turmas/${turmaId}/monitores/${monitorId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${email}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Monitor vinculado à turma com sucesso",
          variant: "default",
        });
        loadMonitores();
        setIsVincularMonitorModalOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao vincular monitor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao vincular monitor:", error);
      toast({
        title: "Erro",
        description: "Erro ao vincular monitor",
        variant: "destructive",
      });
    }
  };

  const handleDesvincularMonitor = async (monitorId: string) => {
    if (!confirm("Tem certeza que deseja desvincular este monitor da turma?")) {
      return;
    }

    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch(
        `/api/turmas/${turmaId}/monitores/${monitorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${email}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Monitor desvinculado da turma com sucesso",
          variant: "default",
        });
        loadMonitores();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao desvincular monitor",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao desvincular monitor:", error);
      toast({
        title: "Erro",
        description: "Erro ao desvincular monitor",
        variant: "destructive",
      });
    }
  };

  const handleCriarAula = async () => {
    try {
      const sessionData = localStorage.getItem("monitorSession");
      if (!sessionData) return;

      const { email } = JSON.parse(sessionData);

      const response = await fetch("/api/aulas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          ...novaAulaForm,
          turma_id: turmaId,
          carga_horaria: parseInt(novaAulaForm.carga_horaria),
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Aula criada com sucesso",
          variant: "default",
        });
        setIsNovaAulaModalOpen(false);
        setNovaAulaForm({
          titulo: "",
          descricao: "",
          data_aula: "",
          carga_horaria: "",
          conteudo: "",
        });
        loadAulas();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar aula",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar aula",
        variant: "destructive",
      });
    }
  };

  const handleAulaClick = (aulaId: string) => {
    if (monitorEmail) {
      router.push(
        `/ensino/aulas/${aulaId}/frequencia?email=${encodeURIComponent(
          monitorEmail
        )}`
      );
    } else {
      router.push(`/ensino/aulas/${aulaId}/frequencia`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  // Filtrar listas
  const filteredAlunas = alunas.filter(
    (aluna) =>
      aluna.nome.toLowerCase().includes(searchAlunas.toLowerCase()) ||
      aluna.email.toLowerCase().includes(searchAlunas.toLowerCase())
  );

  const filteredMonitores = monitores.filter(
    (monitor) =>
      monitor.nome.toLowerCase().includes(searchMonitores.toLowerCase()) ||
      monitor.email.toLowerCase().includes(searchMonitores.toLowerCase())
  );

  const filteredAulas = aulas.filter(
    (aula) =>
      aula.titulo.toLowerCase().includes(searchAulas.toLowerCase()) ||
      aula.descricao?.toLowerCase().includes(searchAulas.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da turma...</p>
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

  if (!turma) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Turma não encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            A turma solicitada não existe ou você não tem permissão para
            acessá-la.
          </p>
          <Button onClick={handleBack}>Voltar para Turmas</Button>
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
                  {turma.nome}
                </h1>
                <p className="text-xs text-gray-500">
                  {turma.curso?.nome} • {turma.ano_letivo}/{turma.semestre}º sem
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
        {/* Header da Turma */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
                  <School className="w-6 h-6" />
                  {turma.nome}
                </CardTitle>
                <CardDescription className="text-blue-700 mt-2">
                  {turma.descricao || "Sem descrição"}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-2">
                  {turma.curso?.nome}
                </Badge>
                <div className="text-sm text-blue-700">
                  {turma.ano_letivo} • {turma.semestre}º Semestre
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {alunas.length}
                </div>
                <div className="text-sm text-blue-600">Alunas</div>
              </div>
              {monitorRole === "ADM" && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {monitores.length}
                  </div>
                  <div className="text-sm text-blue-600">Monitores</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {aulas.length}
                </div>
                <div className="text-sm text-blue-600">Aulas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {turma.curso?.carga_horaria || 0}h
                </div>
                <div className="text-sm text-blue-600">Carga Horária</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abas de Conteúdo */}
        <Tabs defaultValue="alunas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="alunas" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Alunas
            </TabsTrigger>
            {monitorRole === "ADM" && (
              <TabsTrigger
                value="monitores"
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Monitores
              </TabsTrigger>
            )}
            <TabsTrigger value="aulas" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Aulas e Frequência
            </TabsTrigger>
          </TabsList>

          {/* Aba Alunas */}
          <TabsContent value="alunas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Alunas da Turma
                    </CardTitle>
                    <CardDescription>
                      Lista de alunas matriculadas nesta turma
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      loadAlunasCandidatas();
                      setIsVincularAlunaModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Vincular Aluna
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar alunas..."
                      value={searchAlunas}
                      onChange={(e) => setSearchAlunas(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredAlunas.length > 0 ? (
                    filteredAlunas.map((aluna) => (
                      <div
                        key={aluna.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {aluna.nome}
                          </h4>
                          <p className="text-sm text-gray-600">{aluna.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {aluna.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Inscrita em {formatDate(aluna.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDesvincularAluna(aluna.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Desvincular
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma aluna encontrada
                      </h3>
                      <p className="text-gray-600">
                        {searchAlunas
                          ? "Tente ajustar o filtro de busca"
                          : "Não há alunas vinculadas a esta turma"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Monitores (apenas para ADM) */}
          {monitorRole === "ADM" && (
            <TabsContent value="monitores">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-purple-600" />
                        Monitores da Turma
                      </CardTitle>
                      <CardDescription>
                        Lista de monitores vinculados a esta turma
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        loadMonitoresCandidatos();
                        setIsVincularMonitorModalOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Vincular Monitor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar monitores..."
                        value={searchMonitores}
                        onChange={(e) => setSearchMonitores(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredMonitores.length > 0 ? (
                      filteredMonitores.map((monitor) => (
                        <div
                          key={monitor.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {monitor.nome}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {monitor.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={
                                  monitor.role === "ADM"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }
                              >
                                {monitor.role === "ADM"
                                  ? "Administrador"
                                  : "Monitor"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Cadastrado em {formatDate(monitor.created_at)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesvincularMonitor(monitor.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="w-4 h-4 mr-1" />
                            Desvincular
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Nenhum monitor encontrado
                        </h3>
                        <p className="text-gray-600">
                          {searchMonitores
                            ? "Tente ajustar o filtro de busca"
                            : "Não há monitores vinculados a esta turma"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Aba Aulas e Frequência */}
          <TabsContent value="aulas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      Aulas e Frequência
                    </CardTitle>
                    <CardDescription>
                      Registro de aulas e controle de frequência das alunas
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsNovaAulaModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Nova Aula
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar aulas..."
                      value={searchAulas}
                      onChange={(e) => setSearchAulas(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredAulas.length > 0 ? (
                    filteredAulas.map((aula) => (
                      <div
                        key={aula.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                        onClick={() => handleAulaClick(aula.id)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                            {aula.titulo}
                          </h4>
                          {aula.descricao && (
                            <p className="text-sm text-gray-600 mt-1">
                              {aula.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(aula.data_aula)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {aula.carga_horaria}h
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Frequência
                          </Button>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhuma aula encontrada
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchAulas
                          ? "Tente ajustar o filtro de busca"
                          : "Não há aulas registradas para esta turma"}
                      </p>
                      {!searchAulas && (
                        <Button
                          onClick={() => setIsNovaAulaModalOpen(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar Primeira Aula
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Vincular Aluna */}
      <Dialog
        open={isVincularAlunaModalOpen}
        onOpenChange={setIsVincularAlunaModalOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Vincular Aluna à Turma</DialogTitle>
            <DialogDescription>
              Selecione uma aluna matriculada para vincular a esta turma
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {alunasCandidatas.length > 0 ? (
              alunasCandidatas.map((aluna) => (
                <div
                  key={aluna.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {aluna.nome}
                    </h4>
                    <p className="text-sm text-gray-600">{aluna.email}</p>
                    <Badge className="text-xs bg-green-100 text-green-800 mt-1">
                      {aluna.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleVincularAluna(aluna.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Vincular
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Não há alunas disponíveis para vinculação
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVincularAlunaModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vincular Monitor */}
      {monitorRole === "ADM" && (
        <Dialog
          open={isVincularMonitorModalOpen}
          onOpenChange={setIsVincularMonitorModalOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Vincular Monitor à Turma</DialogTitle>
              <DialogDescription>
                Selecione um monitor para vincular a esta turma
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {monitoresCandidatos.length > 0 ? (
                monitoresCandidatos.map((monitor) => (
                  <div
                    key={monitor.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {monitor.nome}
                      </h4>
                      <p className="text-sm text-gray-600">{monitor.email}</p>
                      <Badge
                        className={`text-xs mt-1 ${
                          monitor.role === "ADM"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {monitor.role === "ADM" ? "Administrador" : "Monitor"}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleVincularMonitor(monitor.id)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Vincular
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Não há monitores disponíveis para vinculação
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVincularMonitorModalOpen(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Nova Aula */}
      <Dialog open={isNovaAulaModalOpen} onOpenChange={setIsNovaAulaModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Aula</DialogTitle>
            <DialogDescription>
              Preencha as informações da aula ministrada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título da Aula *</Label>
              <Input
                id="titulo"
                value={novaAulaForm.titulo}
                onChange={(e) =>
                  setNovaAulaForm({ ...novaAulaForm, titulo: e.target.value })
                }
                placeholder="Ex: Introdução ao HTML"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={novaAulaForm.descricao}
                onChange={(e) =>
                  setNovaAulaForm({
                    ...novaAulaForm,
                    descricao: e.target.value,
                  })
                }
                placeholder="Breve descrição da aula..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_aula">Data e Hora da Aula *</Label>
                <Input
                  id="data_aula"
                  type="datetime-local"
                  value={novaAulaForm.data_aula}
                  onChange={(e) =>
                    setNovaAulaForm({
                      ...novaAulaForm,
                      data_aula: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="carga_horaria">Carga Horária (horas) *</Label>
                <Input
                  id="carga_horaria"
                  type="number"
                  value={novaAulaForm.carga_horaria}
                  onChange={(e) =>
                    setNovaAulaForm({
                      ...novaAulaForm,
                      carga_horaria: e.target.value,
                    })
                  }
                  placeholder="2"
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="conteudo">Conteúdo Ministrado</Label>
              <Textarea
                id="conteudo"
                value={novaAulaForm.conteudo}
                onChange={(e) =>
                  setNovaAulaForm({ ...novaAulaForm, conteudo: e.target.value })
                }
                placeholder="Descreva o conteúdo abordado na aula..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNovaAulaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarAula}
              disabled={
                !novaAulaForm.titulo ||
                !novaAulaForm.data_aula ||
                !novaAulaForm.carga_horaria
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Registrar Aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

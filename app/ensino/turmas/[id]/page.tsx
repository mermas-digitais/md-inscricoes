"use client";

// Evita prerender estático que aciona o bailout de CSR quando usamos hooks de navegação
export const dynamic = "force-dynamic";

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
import { SESSION_TIMEOUT } from "@/lib/constants/session";
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
import { ModuleHeader } from "@/components/module-header";
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
  turma_id: string;
  data_aula: string;
  conteudo: string;
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
    data_aula: "",
    conteudo: "",
  });

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

  // Função de navegação para voltar
  const handleBack = () => {
    if (monitorEmail) {
      router.push(`/ensino/turmas?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push("/ensino/turmas");
    }
  };

  // Verificar sessão existente
  useEffect(() => {
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
        const result = await response.json();
        if (result.success && result.data) {
          setAlunas(result.data.alunas_vinculadas || []);
        }
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

      const response = await fetch(
        `/api/turmas/${turmaId}/monitores/candidatos`,
        {
          headers: {
            Authorization: `Bearer ${email}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMonitores(result.data.monitores_vinculados || []);
        }
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
        const result = await response.json();
        if (result.success && result.data) {
          setAulas(result.data.aulas || []);
        }
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

      const response = await fetch(`/api/turmas/${turmaId}/alunas`, {
        headers: {
          Authorization: `Bearer ${email}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAlunasCandidatas(result.data.alunas_candidatas || []);
        }
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
        const result = await response.json();
        if (result.success && result.data) {
          setMonitoresCandidatos(result.data.monitores_candidatos || []);
        }
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

      // A data já está no formato correto (YYYY-MM-DD) do input type="date"
      const dataAula = novaAulaForm.data_aula;

      const response = await fetch("/api/aulas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${email}`,
        },
        body: JSON.stringify({
          turma_id: turmaId,
          data_aula: dataAula,
          conteudo_ministrado: novaAulaForm.conteudo,
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
          data_aula: "",
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

  const filteredAulas = aulas.filter((aula) =>
    aula.conteudo?.toLowerCase().includes(searchAulas.toLowerCase())
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ModuleHeader
        moduleName="Detalhes da Turma"
        moduleDescription={
          turma
            ? `Gerencie os dados da turma ${turma.nome}`
            : "Carregando informações da turma..."
        }
        moduleIcon={GraduationCap}
        gradientFrom="from-blue-500"
        gradientTo="to-purple-600"
        iconColor="text-blue-300"
      />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Turmas
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Informações da Turma */}
        <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 backdrop-blur-sm border border-blue-100/50">
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                    {turma.nome}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    {turma.descricao || "Sem descrição disponível"}
                  </CardDescription>
                  <div className="mt-2 text-sm text-blue-600 font-medium">
                    {turma.ano_letivo} • {turma.semestre}º Semestre
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2 rounded-full font-medium text-sm">
                  {turma.curso?.nome}
                </Badge>
                {turma.ativa ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-2 rounded-full font-medium text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    Ativa
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 px-4 py-2 rounded-full font-medium text-sm">
                    <div className="w-2 h-2 bg-slate-500 rounded-full mr-2" />
                    Inativa
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {alunas.length}
                </div>
                <div className="text-sm font-medium text-blue-600">Alunas</div>
              </div>
              {monitorRole === "ADM" && (
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100/50 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Monitor className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {monitores.length}
                  </div>
                  <div className="text-sm font-medium text-purple-600">
                    Monitores
                  </div>
                </div>
              )}
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-green-100/50 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {aulas.length}
                </div>
                <div className="text-sm font-medium text-green-600">Aulas</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-orange-100/50 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {turma.curso?.carga_horaria || 0}h
                </div>
                <div className="text-sm font-medium text-orange-600">
                  Carga Horária
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abas de Conteúdo */}
        <Tabs defaultValue="alunas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/60 backdrop-blur-sm border border-blue-100/50 shadow-xl rounded-xl h-14">
            <TabsTrigger
              value="alunas"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg h-12 font-medium"
            >
              <User className="w-4 h-4" />
              Alunas
            </TabsTrigger>
            {monitorRole === "ADM" && (
              <TabsTrigger
                value="monitores"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg h-12 font-medium"
              >
                <Monitor className="w-4 h-4" />
                Monitores
              </TabsTrigger>
            )}
            <TabsTrigger
              value="aulas"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg h-12 font-medium"
            >
              <BookOpen className="w-4 h-4" />
              Aulas e Frequência
            </TabsTrigger>
          </TabsList>

          {/* Aba Alunas */}
          <TabsContent value="alunas">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 backdrop-blur-sm border border-blue-100/50">
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Alunas da Turma
                      </CardTitle>
                      <CardDescription className="text-blue-600/70">
                        Lista de alunas matriculadas nesta turma
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      loadAlunasCandidatas();
                      setIsVincularAlunaModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Vincular Aluna
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                    Buscar Alunas
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchAlunas}
                      onChange={(e) => setSearchAlunas(e.target.value)}
                      className="pl-12 h-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredAlunas.length > 0 ? (
                    filteredAlunas.map((aluna) => (
                      <div
                        key={aluna.id}
                        className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 hover:border-blue-400/50 hover:shadow-xl transition-all duration-300 p-6 rounded-2xl"
                      >
                        {/* Accent Border */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-300">
                                {aluna.nome}
                              </h4>
                              <p className="text-blue-600/70 font-medium mt-1">
                                {aluna.email}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 rounded-full font-medium">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                  {aluna.status}
                                </Badge>
                                <span className="text-xs text-gray-500 bg-blue-50/50 px-3 py-1 rounded-full">
                                  Inscrita em {formatDate(aluna.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDesvincularAluna(aluna.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-xl font-medium"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Desvincular
                          </Button>
                        </div>

                        {/* Subtle hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/10 transition-all duration-500 rounded-2xl pointer-events-none" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-blue-200/50 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Nenhuma aluna encontrada
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {searchAlunas
                            ? "Tente ajustar o filtro de busca."
                            : "Não há alunas vinculadas a esta turma."}
                        </p>
                        <Button
                          onClick={() => {
                            loadAlunasCandidatas();
                            setIsVincularAlunaModalOpen(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                          <UserPlus className="w-5 h-5 mr-2" />
                          Vincular Primeira Aluna
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Monitores (apenas para ADM) */}
          {monitorRole === "ADM" && (
            <TabsContent value="monitores">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 backdrop-blur-sm border border-purple-100/50">
                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Monitor className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          Monitores da Turma
                        </CardTitle>
                        <CardDescription className="text-purple-600/70">
                          Lista de monitores vinculados a esta turma
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        loadMonitoresCandidatos();
                        setIsVincularMonitorModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Vincular Monitor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                      Buscar Monitores
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchMonitores}
                        onChange={(e) => setSearchMonitores(e.target.value)}
                        className="pl-12 h-12 border-purple-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredMonitores.length > 0 ? (
                      filteredMonitores.map((monitor) => (
                        <div
                          key={monitor.id}
                          className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 hover:border-purple-400/50 hover:shadow-xl transition-all duration-300 p-6 rounded-2xl"
                        >
                          {/* Accent Border */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Monitor className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors duration-300">
                                  {monitor.nome}
                                </h4>
                                <p className="text-purple-600/70 font-medium mt-1">
                                  {monitor.email}
                                </p>
                                <div className="flex items-center gap-3 mt-3">
                                  <Badge
                                    className={
                                      monitor.role === "ADM"
                                        ? "bg-purple-100 text-purple-800 border-purple-300 px-3 py-1 rounded-full font-medium"
                                        : "bg-blue-100 text-blue-800 border-blue-300 px-3 py-1 rounded-full font-medium"
                                    }
                                  >
                                    <div
                                      className={`w-2 h-2 ${
                                        monitor.role === "ADM"
                                          ? "bg-purple-500"
                                          : "bg-blue-500"
                                      } rounded-full mr-2`}
                                    />
                                    {monitor.role === "ADM"
                                      ? "Administrador"
                                      : "Monitor"}
                                  </Badge>
                                  <span className="text-xs text-gray-500 bg-purple-50/50 px-3 py-1 rounded-full">
                                    Cadastrado em{" "}
                                    {formatDate(monitor.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDesvincularMonitor(monitor.id)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-xl font-medium"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Desvincular
                            </Button>
                          </div>

                          {/* Subtle hover effect overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/5 group-hover:to-purple-600/10 transition-all duration-500 rounded-2xl pointer-events-none" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-purple-200/50 max-w-md mx-auto">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                            <Monitor className="w-8 h-8 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Nenhum monitor encontrado
                          </h3>
                          <p className="text-gray-600 mb-6">
                            {searchMonitores
                              ? "Tente ajustar o filtro de busca."
                              : "Não há monitores vinculados a esta turma."}
                          </p>
                          <Button
                            onClick={() => {
                              loadMonitoresCandidatos();
                              setIsVincularMonitorModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            <UserPlus className="w-5 h-5 mr-2" />
                            Vincular Primeiro Monitor
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Aba Aulas e Frequência */}
          <TabsContent value="aulas">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-green-100/20 backdrop-blur-sm border border-green-100/50">
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Aulas e Frequência
                      </CardTitle>
                      <CardDescription className="text-green-600/70">
                        Registro de aulas e controle de frequência das alunas
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsNovaAulaModalOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Nova Aula
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                    Buscar Aulas
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                    <Input
                      placeholder="Buscar por título ou descrição..."
                      value={searchAulas}
                      onChange={(e) => setSearchAulas(e.target.value)}
                      className="pl-12 h-12 border-green-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredAulas.length > 0 ? (
                    filteredAulas.map((aula) => (
                      <div
                        key={aula.id}
                        className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 hover:border-green-400/50 hover:shadow-xl transition-all duration-300 p-6 rounded-2xl cursor-pointer"
                        onClick={() => handleAulaClick(aula.id)}
                      >
                        {/* Accent Border */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors duration-300">
                                Aula de {formatDate(aula.data_aula)}
                              </h4>
                              {aula.conteudo && (
                                <p className="text-green-600/70 font-medium mt-1 line-clamp-2">
                                  {aula.conteudo}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2 text-sm bg-green-50/50 px-3 py-1 rounded-full">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span className="text-green-700 font-medium">
                                    {formatDate(aula.data_aula)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 hover:text-green-700 rounded-xl font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAulaClick(aula.id);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Frequência
                            </Button>
                            <div className="w-8 h-8 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors duration-300 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-green-600 group-hover:translate-x-0.5 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>

                        {/* Subtle hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-600/0 group-hover:from-green-500/5 group-hover:to-green-600/10 transition-all duration-500 rounded-2xl pointer-events-none" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-green-200/50 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Nenhuma aula encontrada
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {searchAulas
                            ? "Tente ajustar o filtro de busca."
                            : "Não há aulas registradas para esta turma."}
                        </p>
                        {!searchAulas && (
                          <Button
                            onClick={() => setIsNovaAulaModalOpen(true)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Registrar Primeira Aula
                          </Button>
                        )}
                      </div>
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
        <DialogContent className="sm:max-w-[700px] border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 backdrop-blur-sm">
          <DialogHeader className="pb-4 pt-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              Vincular Aluna à Turma
            </DialogTitle>
            <DialogDescription className="text-blue-600/70 mt-2">
              Selecione uma aluna matriculada para vincular a esta turma
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-3 py-2">
            {alunasCandidatas.length > 0 ? (
              alunasCandidatas.map((aluna) => (
                <div
                  key={aluna.id}
                  className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 hover:border-blue-400/50 hover:shadow-lg transition-all duration-300 p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          {aluna.nome}
                        </h4>
                        <p className="text-blue-600/70 font-medium text-sm">
                          {aluna.email}
                        </p>
                        <Badge className="bg-green-100 text-green-800 border-green-300 px-2 py-1 rounded-full font-medium text-xs mt-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                          {aluna.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleVincularAluna(aluna.id)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-blue-200/50">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Nenhuma aluna disponível
                  </h3>
                  <p className="text-gray-600">
                    Não há alunas disponíveis para vinculação
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-blue-100/50">
            <Button
              variant="outline"
              onClick={() => setIsVincularAlunaModalOpen(false)}
              className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg font-medium"
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
          <DialogContent className="sm:max-w-[700px] border-0 shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 backdrop-blur-sm">
            <DialogHeader className="pb-4 pt-2">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                Vincular Monitor à Turma
              </DialogTitle>
              <DialogDescription className="text-purple-600/70 mt-2">
                Selecione um monitor para vincular a esta turma
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto space-y-3 py-2">
              {monitoresCandidatos.length > 0 ? (
                monitoresCandidatos.map((monitor) => (
                  <div
                    key={monitor.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 hover:border-purple-400/50 hover:shadow-lg transition-all duration-300 p-4 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                            {monitor.nome}
                          </h4>
                          <p className="text-purple-600/70 font-medium text-sm">
                            {monitor.email}
                          </p>
                          <Badge
                            className={`${
                              monitor.role === "ADM"
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            } px-2 py-1 rounded-full font-medium text-xs mt-2`}
                          >
                            <div
                              className={`w-1.5 h-1.5 ${
                                monitor.role === "ADM"
                                  ? "bg-purple-500"
                                  : "bg-blue-500"
                              } rounded-full mr-1.5`}
                            />
                            {monitor.role === "ADM"
                              ? "Administrador"
                              : "Monitor"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleVincularMonitor(monitor.id)}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        Vincular
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-purple-200/50">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                      <Monitor className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Nenhum monitor disponível
                    </h3>
                    <p className="text-gray-600">
                      Não há monitores disponíveis para vinculação
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-purple-100/50">
              <Button
                variant="outline"
                onClick={() => setIsVincularMonitorModalOpen(false)}
                className="border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600 hover:text-purple-700 rounded-lg font-medium"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Nova Aula */}
      <Dialog open={isNovaAulaModalOpen} onOpenChange={setIsNovaAulaModalOpen}>
        <DialogContent className="sm:max-w-[700px] border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/30 to-green-100/20 backdrop-blur-sm">
          <DialogHeader className="pb-4 pt-2">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Registrar Nova Aula
            </DialogTitle>
            <DialogDescription className="text-green-600/70 mt-2">
              Preencha as informações da aula ministrada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div>
              <Label
                htmlFor="data_aula"
                className="text-sm font-semibold text-gray-800 mb-2 block"
              >
                Data da Aula *
              </Label>
              <Input
                id="data_aula"
                type="date"
                value={novaAulaForm.data_aula}
                onChange={(e) =>
                  setNovaAulaForm({
                    ...novaAulaForm,
                    data_aula: e.target.value,
                  })
                }
                className="h-11 border-green-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl"
              />
            </div>

            <div>
              <Label
                htmlFor="conteudo"
                className="text-sm font-semibold text-gray-800 mb-2 block"
              >
                Conteúdo Ministrado *
              </Label>
              <Textarea
                id="conteudo"
                value={novaAulaForm.conteudo}
                onChange={(e) =>
                  setNovaAulaForm({ ...novaAulaForm, conteudo: e.target.value })
                }
                placeholder="Descreva o conteúdo abordado na aula..."
                rows={4}
                className="border-green-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-green-100/50 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsNovaAulaModalOpen(false)}
              className="border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600 hover:text-green-700 rounded-lg font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarAula}
              disabled={!novaAulaForm.data_aula || !novaAulaForm.conteudo}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Registrar Aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

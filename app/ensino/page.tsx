"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  BookOpen,
  Calendar,
  FileText,
  Monitor,
  Shield,
  UserCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Star,
  BarChart3,
  Plus,
  ChevronRight,
} from "lucide-react";

export default function EnsinoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalCursos: 0,
    totalTurmas: 0,
    totalAlunas: 0,
    totalAulas: 0,
    cursosAtivos: 0,
    turmasAtivas: 0,
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
            loadStats();
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      }

      // Se não há sessão válida, redirecionar para painel
      router.push("/painel");
    };

    checkSession();
  }, [router]);

  const loadStats = async () => {
    try {
      // Carregar estatísticas dos cursos
      const cursosResponse = await fetch("/api/cursos", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("monitorSession")
              ? JSON.parse(localStorage.getItem("monitorSession")!).email
              : ""
          }`,
        },
      });

      if (cursosResponse.ok) {
        const cursosData = await cursosResponse.json();
        const totalCursos = cursosData.length;
        const cursosAtivos = cursosData.filter(
          (curso: any) => curso.ativo
        ).length;

        // Carregar estatísticas das turmas
        const turmasResponse = await fetch("/api/turmas", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("monitorSession")
                ? JSON.parse(localStorage.getItem("monitorSession")!).email
                : ""
            }`,
          },
        });

        if (turmasResponse.ok) {
          const turmasData = await turmasResponse.json();
          const totalTurmas = turmasData.length;
          const turmasAtivas = turmasData.filter(
            (turma: any) => turma.ativa
          ).length;

          setStats({
            totalCursos,
            totalTurmas,
            totalAlunas: 0, // TODO: Implementar contagem de alunas
            totalAulas: 0, // TODO: Implementar contagem de aulas
            cursosAtivos,
            turmasAtivas,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleNavigateToModule = (module: string) => {
    if (monitorEmail) {
      router.push(`/${module}?email=${encodeURIComponent(monitorEmail)}`);
    } else {
      router.push(`/${module}`);
    }
  };

  const handleNavigateToSection = (section: string) => {
    if (monitorEmail) {
      router.push(
        `/ensino/${section}?email=${encodeURIComponent(monitorEmail)}`
      );
    } else {
      router.push(`/ensino/${section}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando módulo de ensino...</p>
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
      <ModuleHeader
        moduleName="Ensino"
        moduleDescription="Cursos, turmas, aulas e frequência"
        moduleIcon={GraduationCap}
        gradientFrom="from-green-100"
        gradientTo="to-green-200"
        iconColor="text-green-700"
      />

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estatísticas Gerais */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Dashboard do Ensino
            </CardTitle>
            <CardDescription>
              Visão geral do módulo de ensino e atividades pedagógicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {stats.totalCursos}
                </div>
                <p className="text-sm font-medium text-green-600">
                  Total Cursos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {stats.cursosAtivos}
                </div>
                <p className="text-sm font-medium text-blue-600">
                  Cursos Ativos
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {stats.totalTurmas}
                </div>
                <p className="text-sm font-medium text-purple-600">
                  Total Turmas
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                <div className="text-2xl font-bold text-pink-700">
                  {stats.turmasAtivas}
                </div>
                <p className="text-sm font-medium text-pink-600">
                  Turmas Ativas
                </p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">
                  {stats.totalAlunas}
                </div>
                <p className="text-sm font-medium text-orange-600">Alunas</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                <div className="text-2xl font-bold text-teal-700">
                  {stats.totalAulas}
                </div>
                <p className="text-sm font-medium text-teal-600">Aulas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seções do Módulo */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Gestão de Cursos */}
          <Card
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleNavigateToSection("cursos")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-green-900">
                      Gestão de Cursos
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Configure e administre os cursos
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-800">Cursos cadastrados</span>
                  <span className="font-semibold text-green-900">
                    {stats.totalCursos}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-800">Cursos ativos</span>
                  <span className="font-semibold text-green-900">
                    {stats.cursosAtivos}
                  </span>
                </div>
                {monitorRole === "ADM" && (
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToSection("cursos");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Curso
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestão de Turmas */}
          <Card
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleNavigateToSection("turmas")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-blue-900">
                      Gestão de Turmas
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Organize turmas e vincule alunas
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Turmas criadas</span>
                  <span className="font-semibold text-blue-900">
                    {stats.totalTurmas}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Turmas ativas</span>
                  <span className="font-semibold text-blue-900">
                    {stats.turmasAtivas}
                  </span>
                </div>
                {monitorRole === "ADM" && (
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToSection("turmas");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Turma
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Zap className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 border-green-200 hover:bg-green-50"
                onClick={() => handleNavigateToSection("cursos")}
              >
                <BookOpen className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold text-green-900">Ver Cursos</div>
                  <div className="text-xs text-green-600">Gerencie cursos</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 border-blue-200 hover:bg-blue-50"
                onClick={() => handleNavigateToSection("turmas")}
              >
                <Users className="w-8 h-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold text-blue-900">Ver Turmas</div>
                  <div className="text-xs text-blue-600">Administre turmas</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 border-purple-200 hover:bg-purple-50"
                onClick={() => handleNavigateToModule("matriculas")}
              >
                <FileText className="w-8 h-8 text-purple-600" />
                <div className="text-center">
                  <div className="font-semibold text-purple-900">
                    Matrículas
                  </div>
                  <div className="text-xs text-purple-600">Módulo anterior</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

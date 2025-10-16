"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
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
  Calendar,
  Users,
  BookOpen,
  Clock,
  FileText,
  Monitor,
  Shield,
  UserCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Star,
  BarChart3,
  Plus,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  UserPlus,
  GraduationCap,
} from "lucide-react";

function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monitorEmail = searchParams.get("email");

  const [monitorName, setMonitorName] = useState("");
  const [monitorRole, setMonitorRole] = useState<"MONITOR" | "ADM">("MONITOR");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalEventos: 0,
    eventosAtivos: 0,
    totalInscricoes: 0,
    totalParticipantes: 0,
    orientadoresAtivos: 0,
    modalidadesAtivas: 0,
  });

  // Estados para eventos
  const [eventos, setEventos] = useState<any[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
            loadEventos();
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
      const response = await fetch("/api/eventos?stats=true");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error("Erro ao carregar estatísticas");
        // Fallback para dados zerados em caso de erro
        setStats({
          totalEventos: 0,
          eventosAtivos: 0,
          totalInscricoes: 0,
          totalParticipantes: 0,
          orientadoresAtivos: 0,
          modalidadesAtivas: 0,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      // Fallback para dados zerados em caso de erro
      setStats({
        totalEventos: 0,
        eventosAtivos: 0,
        totalInscricoes: 0,
        totalParticipantes: 0,
        orientadoresAtivos: 0,
        modalidadesAtivas: 0,
      });
    }
  };

  const loadEventos = async () => {
    try {
      const response = await fetch("/api/eventos");
      if (response.ok) {
        const data = await response.json();
        setEventos(data.eventos || []);
        setFilteredEventos(data.eventos || []);
      } else {
        console.error("Erro ao carregar eventos");
        setEventos([]);
        setFilteredEventos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setEventos([]);
      setFilteredEventos([]);
    }
  };

  // Filtrar eventos
  useEffect(() => {
    let filtered = eventos;

    if (searchTerm) {
      filtered = filtered.filter(
        (evento) =>
          evento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((evento) => {
        if (filterStatus === "ativo") return evento.ativo;
        if (filterStatus === "inativo") return !evento.ativo;
        return true;
      });
    }

    setFilteredEventos(filtered);
  }, [eventos, searchTerm, filterStatus]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getEventStatus = (evento: any) => {
    const now = new Date();
    const inicio = new Date(evento.dataInicio);
    const fim = new Date(evento.dataFim);

    if (!evento.ativo)
      return { label: "Inativo", color: "bg-gray-100 text-gray-800" };
    if (now < inicio)
      return { label: "Agendado", color: "bg-blue-100 text-blue-800" };
    if (now >= inicio && now <= fim)
      return { label: "Em Andamento", color: "bg-green-100 text-green-800" };
    return { label: "Finalizado", color: "bg-purple-100 text-purple-800" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-poppins">
            Carregando módulo de eventos...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-poppins">
            Redirecionando para autenticação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header com navegação */}
      <ModuleHeader
        moduleName="Eventos"
        moduleDescription="Gestão de eventos e inscrições em grupo"
        moduleIcon={Calendar}
        gradientFrom="from-purple-100"
        gradientTo="to-purple-200"
        iconColor="text-purple-700"
      />

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estatísticas Gerais */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Dashboard de Eventos
            </CardTitle>
            <CardDescription>
              Visão geral dos eventos e inscrições em grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.totalEventos}
                    </p>
                    <p className="text-sm text-purple-700">Total de Eventos</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.eventosAtivos}
                    </p>
                    <p className="text-sm text-green-700">Eventos Ativos</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.totalInscricoes}
                    </p>
                    <p className="text-sm text-blue-700">Inscrições</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-900">
                      {stats.totalParticipantes}
                    </p>
                    <p className="text-sm text-orange-700">Participantes</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-900">
                      {stats.orientadoresAtivos}
                    </p>
                    <p className="text-sm text-pink-700">Orientadores</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-900">
                      {stats.modalidadesAtivas}
                    </p>
                    <p className="text-sm text-indigo-700">Modalidades</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação do Módulo */}
        <NavigationMenu className="mb-8">
          <NavigationMenuList className="flex flex-wrap gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/eventos"
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-purple-100 data-[state=open]:bg-purple-50 border border-purple-200"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Eventos
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/eventos/orientadores"
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-purple-100 data-[state=open]:bg-purple-50 border border-purple-200"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Orientadores
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/eventos/inscricoes"
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-purple-100 data-[state=open]:bg-purple-50 border border-purple-200"
              >
                <Users className="w-4 h-4 mr-2" />
                Inscrições
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/eventos/relatorios"
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-purple-50 hover:text-purple-600 focus:bg-purple-50 focus:text-purple-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-purple-100 data-[state=open]:bg-purple-50 border border-purple-200"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Lista de Eventos */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Eventos Cadastrados
                </CardTitle>
                <CardDescription>
                  Gerencie todos os eventos e suas configurações
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => router.push("/eventos/novo")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {filteredEventos.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum evento encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterStatus !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando seu primeiro evento"}
                </p>
                {!searchTerm && filterStatus === "all" && (
                  <Button
                    onClick={() => router.push("/eventos/novo")}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Evento
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEventos.map((evento) => {
                  const status = getEventStatus(evento);
                  return (
                    <div
                      key={evento.id}
                      className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {evento.nome}
                              </h3>
                              {evento.descricao && (
                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                  {evento.descricao}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>
                                    {formatDate(evento.dataInicio)} -{" "}
                                    {formatDate(evento.dataFim)}
                                  </span>
                                </div>
                                {evento.modalidades && (
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>
                                      {evento.modalidades.length} modalidades
                                    </span>
                                  </div>
                                )}
                                {evento._count && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {evento._count.inscricoesEventos}{" "}
                                      inscrições
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-3">
                          <Badge className={`${status.color} font-medium`}>
                            {status.label}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/eventos/${evento.id}`)
                              }
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/eventos/${evento.id}/editar`)
                              }
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EventosPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-poppins">
          Carregando módulo de eventos...
        </p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function EventosPageWrapper() {
  return (
    <Suspense fallback={<EventosPageLoading />}>
      <EventosPage />
    </Suspense>
  );
}

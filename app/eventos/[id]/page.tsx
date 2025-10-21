"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ExportModal, type ExportConfig } from "@/components/export-modal";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils";
import {
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Search,
  Filter,
  FileDown,
  RefreshCw,
  BarChart3,
  UserCheck,
  TrendingUp,
  PieChart,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
  createdAt: string;
  modalidades: Modalidade[];
  _count: {
    inscricoesEventos: number;
  };
}

interface Modalidade {
  id: string;
  nome: string;
  descricao?: string;
  limiteVagas: number;
  vagasOcupadas: number;
}

interface ParticipanteEvento {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
}

interface Orientador {
  nome: string;
  email: string;
  telefone: string;
  escola: string;
}

interface InscricaoEvento {
  id: string;
  equipe_nome?: string;
  nomeEquipe?: string;
  status: string;
  modalidade: { nome: string; id: string };
  orientador: Orientador;
  participantesEventos: ParticipanteEvento[];
  observacoes?: string;
  createdAt?: string;
}

type ViewMode = "inscricoes" | "modalidades" | "estatisticas";

const DetalheEventoPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const eventoId = params?.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoEvento[]>([]);
  const [filteredInscricoes, setFilteredInscricoes] = useState<
    InscricaoEvento[]
  >([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Estados de controle
  const [viewMode, setViewMode] = useState<ViewMode>("inscricoes");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Estados de filtros
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    modalidade: [] as string[],
    escola: "",
  });

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
            loadEvento();
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar sessão:", error);
        }
      }
      router.push("/painel");
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, eventoId]);

  const loadEvento = async () => {
    try {
      const response = await fetch(`/api/eventos/${eventoId}`);
      if (response.ok) {
        const data = await response.json();
        setEvento(data.evento);
        const inscricoesData = data.evento.inscricoesEventos || [];
        setInscricoes(inscricoesData);
        setFilteredInscricoes(inscricoesData);
      } else {
        toast({
          title: "Erro",
          description: "Evento não encontrado",
          variant: "destructive",
        });
        router.push("/eventos");
      }
    } catch (error) {
      console.error("Erro ao carregar evento:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do evento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Função de normalização de texto para busca
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Aplicar filtros
  const applyFilters = useCallback(
    (
      data: InscricaoEvento[],
      filters: typeof activeFilters,
      searchText: string
    ) => {
      let filtered = [...data];

      // Filtro por status
      if (filters.status.length > 0) {
        filtered = filtered.filter((inscricao) =>
          filters.status.includes(inscricao.status)
        );
      }

      // Filtro por modalidade
      if (filters.modalidade.length > 0) {
        filtered = filtered.filter((inscricao) =>
          filters.modalidade.includes(inscricao.modalidade.id)
        );
      }

      // Filtro por escola
      if (filters.escola) {
        const normalizedEscola = normalizeText(filters.escola);
        filtered = filtered.filter((inscricao) =>
          normalizeText(inscricao.orientador?.escola || "").includes(
            normalizedEscola
          )
        );
      }

      // Busca por texto
      if (searchText.trim()) {
        const normalizedSearch = normalizeText(searchText);
        filtered = filtered.filter((inscricao) => {
          const nomeEquipe = normalizeText(
            inscricao.nomeEquipe || inscricao.equipe_nome || ""
          );
          const orientadorNome = normalizeText(
            inscricao.orientador?.nome || ""
          );
          const orientadorEmail = normalizeText(
            inscricao.orientador?.email || ""
          );
          const escola = normalizeText(inscricao.orientador?.escola || "");
          const modalidade = normalizeText(inscricao.modalidade?.nome || "");

          // Busca nos participantes
          const participantesMatch = inscricao.participantesEventos?.some(
            (p) =>
              normalizeText(p.nome).includes(normalizedSearch) ||
              p.cpf.includes(searchText.replace(/\D/g, ""))
          );

          return (
            nomeEquipe.includes(normalizedSearch) ||
            orientadorNome.includes(normalizedSearch) ||
            orientadorEmail.includes(normalizedSearch) ||
            escola.includes(normalizedSearch) ||
            modalidade.includes(normalizedSearch) ||
            participantesMatch
          );
        });
      }

      return filtered;
    },
    []
  );

  // Handler de busca
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      const filtered = applyFilters(inscricoes, activeFilters, term);
      setFilteredInscricoes(filtered);
    },
    [inscricoes, activeFilters, applyFilters]
  );

  // Aplicar filtros quando mudam
  useEffect(() => {
    const filtered = applyFilters(inscricoes, activeFilters, searchTerm);
    setFilteredInscricoes(filtered);
  }, [activeFilters, inscricoes, searchTerm, applyFilters]);

  // Limpar filtros
  const clearFilters = () => {
    setActiveFilters({
      status: [],
      modalidade: [],
      escola: "",
    });
    setSearchTerm("");
  };

  // Alternar filtro
  const toggleFilter = (
    filterType: keyof typeof activeFilters,
    value: string
  ) => {
    setActiveFilters((prev) => {
      if (filterType === "status" || filterType === "modalidade") {
        const currentValues = prev[filterType] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterType]: newValues };
      }
      return prev;
    });
  };

  // Exportar dados - abre modal
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  // Processar exportação com configuração do modal
  const handleExport = async (config: ExportConfig) => {
    if (!evento) return;

    const dataToExport = config.includeFiltered
      ? filteredInscricoes
      : inscricoes;

    try {
      switch (config.format) {
        case "csv":
          exportToCSV(dataToExport, config, evento.nome);
          break;
        case "excel":
          await exportToExcel(dataToExport, config, evento.nome);
          break;
        case "pdf":
          await exportToPDF(dataToExport, config, evento.nome);
          break;
      }

      toast({
        title: "Sucesso",
        description: `Dados exportados com sucesso em formato ${config.format.toUpperCase()}!`,
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Calcular estatísticas
  const getStatistics = useCallback(() => {
    if (!evento) return null;

    const totalParticipantes = inscricoes.reduce(
      (acc, inscricao) => acc + (inscricao.participantesEventos?.length || 0),
      0
    );

    const statusCount = inscricoes.reduce((acc, inscricao) => {
      acc[inscricao.status] = (acc[inscricao.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const modalidadesStats = evento.modalidades.map((modalidade) => {
      const inscricoesModalidade = inscricoes.filter(
        (i) => i.modalidade.id === modalidade.id
      );
      const participantesModalidade = inscricoesModalidade.reduce(
        (acc, i) => acc + (i.participantesEventos?.length || 0),
        0
      );
      return {
        ...modalidade,
        inscricoes: inscricoesModalidade.length,
        participantes: participantesModalidade,
        percentualOcupacao:
          modalidade.limiteVagas > 0
            ? (
                (modalidade.vagasOcupadas / modalidade.limiteVagas) *
                100
              ).toFixed(1)
            : "0",
      };
    });

    const escolasUnicas = new Set(
      inscricoes.map((i) => i.orientador?.escola).filter(Boolean)
    ).size;

    return {
      totalInscricoes: inscricoes.length,
      totalParticipantes,
      statusCount,
      modalidadesStats,
      escolasUnicas,
    };
  }, [evento, inscricoes]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getEventStatus = (evento: Evento) => {
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

  const handleDelete = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/eventos/${eventoId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Evento excluído com sucesso",
        });
        router.push("/eventos");
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir evento",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir evento",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <DetalheEventoPageLoading />;
  }

  if (!evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Evento não encontrado.</p>
      </div>
    );
  }

  const status = getEventStatus(evento);
  const statistics = getStatistics();
  const hasActiveFilters =
    activeFilters.status.length > 0 ||
    activeFilters.modalidade.length > 0 ||
    activeFilters.escola !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header do Módulo */}
      <ModuleHeader
        moduleName={evento.nome}
        moduleDescription={`Gestão completa do evento • ${inscricoes.length} inscrições`}
        moduleIcon={Calendar}
        gradientFrom="from-purple-100"
        gradientTo="to-purple-200"
        iconColor="text-purple-700"
      />

      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Botão Voltar e Ações Principais */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/eventos")}
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Eventos
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/eventos/${eventoId}/editar`)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportClick}
              disabled={filteredInscricoes.length === 0}
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvento}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Card de Informações do Evento */}
        <Card className="bg-white border-0 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {evento.nome}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Criado em {formatDate(evento.createdAt).split(" ")[0]}
                  </p>
                </div>
              </div>
              <Badge
                className={`${status.color} font-medium text-sm px-4 py-2`}
              >
                {status.label}
              </Badge>
            </div>

            {evento.descricao && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-gray-700 leading-relaxed">
                  {evento.descricao}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Início</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(evento.dataInicio).split(",")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fim</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(evento.dataFim).split(",")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modalidades</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {evento.modalidades.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Inscrições</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {evento._count.inscricoesEventos}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navegação entre views */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode("inscricoes")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "inscricoes"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Inscrições ({inscricoes.length})
            </button>
            <button
              onClick={() => setViewMode("modalidades")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "modalidades"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-2" />
              Modalidades ({evento.modalidades.length})
            </button>
            <button
              onClick={() => setViewMode("estatisticas")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "estatisticas"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Estatísticas
            </button>
          </div>
        </div>

        {/* View: Inscrições */}
        {viewMode === "inscricoes" && (
          <>
            {/* Barra de Busca e Filtros */}
            <Card className="bg-white border-0 shadow-sm mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Busca */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por equipe, orientador, escola, participante..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Botões de Filtro */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`${
                        showFilters || hasActiveFilters
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : ""
                      }`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <span className="ml-2 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {activeFilters.status.length +
                            activeFilters.modalidade.length +
                            (activeFilters.escola ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Painel de Filtros */}
                {showFilters && (
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    {/* Filtro por Status */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["INSCRITA", "CONFIRMADA", "CANCELADA"].map((st) => (
                          <button
                            key={st}
                            onClick={() => toggleFilter("status", st)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              activeFilters.status.includes(st)
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por Modalidade */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Modalidade
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {evento.modalidades.map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => toggleFilter("modalidade", mod.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              activeFilters.modalidade.includes(mod.id)
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {mod.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtro por Escola */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Escola
                      </label>
                      <input
                        type="text"
                        placeholder="Digite o nome da escola..."
                        value={activeFilters.escola}
                        onChange={(e) =>
                          setActiveFilters((prev) => ({
                            ...prev,
                            escola: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Contador de Resultados */}
                <div className="mt-4 text-sm text-gray-600">
                  {searchTerm || hasActiveFilters ? (
                    <p>
                      <span className="font-semibold text-purple-600">
                        {filteredInscricoes.length}
                      </span>{" "}
                      de {inscricoes.length} inscrições encontradas
                    </p>
                  ) : (
                    <p>
                      Total:{" "}
                      <span className="font-semibold">{inscricoes.length}</span>{" "}
                      inscrições
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Inscrições */}
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="pt-6">
                {filteredInscricoes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchTerm || hasActiveFilters
                        ? "Nenhuma inscrição encontrada com os filtros aplicados"
                        : "Nenhuma inscrição realizada ainda"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInscricoes.map((inscricao) => {
                      const isExpanded = expandedCards.has(inscricao.id);
                      return (
                        <div
                          key={inscricao.id}
                          className="bg-white rounded-xl shadow-md border border-gray-100 transition-all duration-200 overflow-hidden hover:shadow-lg"
                        >
                          {/* Header do Card - Clicável */}
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200"
                            onClick={() => toggleCardExpansion(inscricao.id)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Avatar com inicial */}
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-bold text-sm">
                                  {(
                                    inscricao.nomeEquipe ||
                                    inscricao.orientador?.nome ||
                                    "E"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>

                              {/* Informações principais */}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base text-gray-900 truncate">
                                  {inscricao.nomeEquipe ||
                                    inscricao.orientador?.nome ||
                                    "Equipe"}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs text-blue-600 font-medium bg-blue-50 rounded px-2 py-0.5 border border-blue-200">
                                    {inscricao.modalidade?.nome}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {inscricao.participantesEventos?.length ||
                                      0}{" "}
                                    participante
                                    {(inscricao.participantesEventos?.length ||
                                      0) !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status e ícone */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Badge
                                className={`text-xs ${
                                  inscricao.status === "INSCRITA"
                                    ? "bg-green-100 text-green-800"
                                    : inscricao.status === "CONFIRMADA"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {inscricao.status}
                              </Badge>
                              <Eye
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:text-blue-600 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </div>

                          {/* Conteúdo Expandido */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gradient-to-br from-blue-50/30 to-purple-50/10">
                              {/* Dados do Orientador */}
                              <div className="mb-4">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-purple-600" />
                                  Orientador
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                      {inscricao.orientador?.nome}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700 truncate">
                                      {inscricao.orientador?.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                      {inscricao.orientador?.telefone}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700 truncate">
                                      {inscricao.orientador?.escola}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lista de Participantes */}
                              {inscricao.participantesEventos &&
                                inscricao.participantesEventos.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Users className="w-4 h-4 text-purple-600" />
                                      Participantes (
                                      {inscricao.participantesEventos.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {inscricao.participantesEventos.map(
                                        (participante: ParticipanteEvento) => (
                                          <div
                                            key={participante.id}
                                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                                          >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-purple-700 font-bold text-xs">
                                                  {participante.nome
                                                    .charAt(0)
                                                    .toUpperCase()}
                                                </span>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">
                                                  {participante.nome}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  CPF: {participante.cpf}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="text-xs text-gray-500 flex-shrink-0">
                                              {
                                                formatDate(
                                                  participante.dataNascimento
                                                ).split(" ")[0]
                                              }
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Observações (se houver) */}
                              {inscricao.observacoes && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    Observações
                                  </h4>
                                  <p className="text-sm text-gray-700">
                                    {inscricao.observacoes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* View: Modalidades */}
        {viewMode === "modalidades" && (
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Modalidades ({evento.modalidades.length})
              </CardTitle>
              <CardDescription>
                Modalidades disponíveis para este evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evento.modalidades.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Nenhuma modalidade cadastrada
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {evento.modalidades.map((modalidade) => {
                    const inscricoesModalidade = inscricoes.filter(
                      (i) => i.modalidade.id === modalidade.id
                    );
                    const percentual =
                      modalidade.limiteVagas > 0
                        ? (
                            (modalidade.vagasOcupadas /
                              modalidade.limiteVagas) *
                            100
                          ).toFixed(1)
                        : "0";

                    return (
                      <div
                        key={modalidade.id}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {modalidade.nome}
                            </h4>
                            {modalidade.descricao && (
                              <p className="text-gray-600 text-sm">
                                {modalidade.descricao}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-purple-100 text-purple-800 text-base px-4 py-1">
                              {modalidade.vagasOcupadas}/
                              {modalidade.limiteVagas} vagas
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {inscricoesModalidade.length} inscrições
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Ocupação</span>
                            <span className="font-semibold">{percentual}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                Number(percentual) >= 90
                                  ? "bg-red-500"
                                  : Number(percentual) >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${percentual}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* View: Estatísticas */}
        {viewMode === "estatisticas" && statistics && (
          <div className="space-y-6">
            {/* Cards de Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-700 text-sm font-medium mb-1">
                        Total de Inscrições
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {statistics.totalInscricoes}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 text-sm font-medium mb-1">
                        Total de Participantes
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {statistics.totalParticipantes}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-700 text-sm font-medium mb-1">
                        Modalidades
                      </p>
                      <p className="text-3xl font-bold text-purple-900">
                        {evento.modalidades.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-700 text-sm font-medium mb-1">
                        Escolas Participantes
                      </p>
                      <p className="text-3xl font-bold text-orange-900">
                        {statistics.escolasUnicas}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas por Status */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(statistics.statusCount).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">
                            {status}
                          </span>
                          <Badge
                            className={`${
                              status === "INSCRITA"
                                ? "bg-green-100 text-green-800"
                                : status === "CONFIRMADA"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {count}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {count}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(
                              (count / statistics.totalInscricoes) *
                              100
                            ).toFixed(1)}
                            % do total
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas por Modalidade */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Desempenho por Modalidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.modalidadesStats.map((modalidade) => (
                    <div
                      key={modalidade.id}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {modalidade.nome}
                        </h4>
                        <Badge className="bg-purple-600 text-white">
                          {modalidade.percentualOcupacao}% ocupado
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Inscrições</p>
                          <p className="text-xl font-bold text-gray-900">
                            {modalidade.inscricoes}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Participantes</p>
                          <p className="text-xl font-bold text-gray-900">
                            {modalidade.participantes}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Vagas Ocupadas</p>
                          <p className="text-xl font-bold text-gray-900">
                            {modalidade.vagasOcupadas}/{modalidade.limiteVagas}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              Number(modalidade.percentualOcupacao) >= 90
                                ? "bg-red-500"
                                : Number(modalidade.percentualOcupacao) >= 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${modalidade.percentualOcupacao}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Exportação */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        evento={{
          id: evento.id,
          nome: evento.nome,
        }}
        inscricoes={inscricoes}
        filteredInscricoes={filteredInscricoes}
        onExport={handleExport}
      />
    </div>
  );
};

function DetalheEventoPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-poppins">Carregando evento...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
const DetalheEventoPageWrapper: React.FC = () => (
  <Suspense fallback={<DetalheEventoPageLoading />}>
    <DetalheEventoPage />
  </Suspense>
);

export default DetalheEventoPageWrapper;

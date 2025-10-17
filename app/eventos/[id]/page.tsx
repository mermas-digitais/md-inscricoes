"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  status: string;
  modalidade: { nome: string };
  orientador: Orientador;
  participantesEventos: ParticipanteEvento[];
  observacoes?: string;
}

const DetalheEventoPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const eventoId = params?.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoEvento[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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
        setInscricoes(data.evento.inscricoesEventos || []);
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

  return (
    <div className="grid gap-6">
      {/* Informações do Evento */}
      <Card className="bg-white border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                {evento.nome}
              </CardTitle>
              <CardDescription className="mt-2">
                Criado em {formatDate(evento.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge
                className={`${status.color} font-medium text-sm px-3 py-1`}
              >
                {status.label}
              </Badge>
              <div className="flex gap-2">
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
                  onClick={handleDelete}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {evento.descricao && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Descrição
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {evento.descricao}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                Datas do Evento
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Início</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(evento.dataInicio)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fim</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(evento.dataFim)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Estatísticas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Modalidades</p>
                    <p className="font-semibold text-gray-900">
                      {evento.modalidades.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inscrições</p>
                    <p className="font-semibold text-gray-900">
                      {evento._count.inscricoesEventos}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Modalidades */}
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
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma modalidade cadastrada</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {evento.modalidades.map((modalidade) => (
                <div
                  key={modalidade.id}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {modalidade.nome}
                    </h4>
                    <Badge className="bg-purple-100 text-purple-800">
                      {modalidade.vagasOcupadas}/{modalidade.limiteVagas} vagas
                    </Badge>
                  </div>
                  {modalidade.descricao && (
                    <p className="text-gray-600 text-sm mb-3">
                      {modalidade.descricao}
                    </p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (modalidade.vagasOcupadas / modalidade.limiteVagas) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Inscrições - padrão correto, sem header extra */}
      <Card className="bg-white border-0 shadow-lg">
        <CardContent>
          {inscricoes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma inscrição realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inscricoes.map((inscricao) => {
                const isExpanded = expandedCards.has(inscricao.id);
                return (
                  <div
                    key={inscricao.id}
                    className="bg-white rounded-xl shadow-md border border-gray-100 mb-4 transition-all duration-200 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30"
                      onClick={() => toggleCardExpansion(inscricao.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-lg text-blue-900">
                          {inscricao.equipe_nome ||
                            inscricao.orientador?.nome ||
                            "Equipe"}
                        </div>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 rounded px-2 py-0.5 border border-gray-200">
                          {inscricao.modalidade?.nome}
                        </span>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 rounded px-2 py-0.5 border border-gray-200">
                          {inscricao.participantesEventos?.length || 1}{" "}
                          participante
                          {(inscricao.participantesEventos?.length || 1) > 1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 rounded px-2 py-0.5 border border-gray-200">
                          {inscricao.status}
                        </span>
                        <Eye
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gradient-to-br from-blue-50/30 to-purple-50/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 mb-2">
                          <div>
                            <span className="font-medium text-gray-600">
                              Orientador:
                            </span>{" "}
                            {inscricao.orientador?.nome}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Email:
                            </span>{" "}
                            {inscricao.orientador?.email}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Telefone:
                            </span>{" "}
                            {inscricao.orientador?.telefone}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Escola:
                            </span>{" "}
                            {inscricao.orientador?.escola}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-gray-600">
                            Participantes:
                          </span>
                          <ul className="list-disc ml-6 mt-1">
                            {inscricao.participantesEventos?.map(
                              (p: any, idx: number) => (
                                <li key={p.id || idx} className="text-gray-800">
                                  {p.nome}{" "}
                                  <span className="text-xs text-gray-500">
                                    ({p.cpf})
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
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

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  UserCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
  modalidades: Array<{
    id: string;
    nome: string;
    limiteVagas: number;
    vagasOcupadas: number;
  }>;
  _count: {
    inscricoesEventos: number;
  };
}

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarEventos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/eventos?ativo=true&limit=50");

        if (response.ok) {
          const data = await response.json();
          setEventos(data.eventos);
        } else {
          throw new Error("Erro ao carregar eventos");
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os eventos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregarEventos();
  }, []);

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusEvento = (evento: Evento) => {
    const agora = new Date();
    const inicio = new Date(evento.dataInicio);
    const fim = new Date(evento.dataFim);

    if (agora < inicio) {
      return { status: "Em breve", cor: "bg-blue-100 text-blue-800" };
    } else if (agora >= inicio && agora <= fim) {
      return { status: "Em andamento", cor: "bg-green-100 text-green-800" };
    } else {
      return { status: "Finalizado", cor: "bg-gray-100 text-gray-800" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
              <p className="text-gray-600">Gerencie eventos e credenciamento</p>
            </div>
            <Button
              onClick={() => router.push("/painel/eventos/novo")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {eventos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <CalendarDays className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhum evento encontrado
                </h3>
                <p className="text-gray-600">
                  Crie seu primeiro evento para começar a gerenciar inscrições.
                </p>
                <Button
                  onClick={() => router.push("/painel/eventos/novo")}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {eventos.map((evento) => {
              const statusInfo = getStatusEvento(evento);

              return (
                <Card
                  key={evento.id}
                  className="border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl text-gray-900">
                            {evento.nome}
                          </CardTitle>
                          <Badge className={statusInfo.cor}>
                            {statusInfo.status}
                          </Badge>
                          {evento.ativo ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200"
                            >
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-red-600 border-red-200"
                            >
                              Inativo
                            </Badge>
                          )}
                        </div>
                        {evento.descricao && (
                          <CardDescription className="text-gray-600 mt-2">
                            {evento.descricao}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Informações do Evento */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Período
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatarData(evento.dataInicio)} -{" "}
                              {formatarData(evento.dataFim)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Inscrições
                            </p>
                            <p className="text-sm text-gray-600">
                              {evento._count.inscricoesEventos} equipes
                              inscritas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <CalendarDays className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Modalidades
                            </p>
                            <p className="text-sm text-gray-600">
                              {evento.modalidades.length} modalidades
                              disponíveis
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Modalidades */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Modalidades
                        </h4>
                        <div className="space-y-2">
                          {evento.modalidades.map((modalidade) => (
                            <div
                              key={modalidade.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {modalidade.nome}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {modalidade.vagasOcupadas}/
                                  {modalidade.limiteVagas}
                                </span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 transition-all duration-300"
                                    style={{
                                      width: `${
                                        (modalidade.vagasOcupadas /
                                          modalidade.limiteVagas) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() =>
                          router.push(`/painel/eventos/${evento.id}`)
                        }
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </Button>

                      <Button
                        onClick={() =>
                          router.push(
                            `/painel/eventos/${evento.id}/credenciamento`
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Credenciamento
                      </Button>

                      <Button
                        onClick={() =>
                          router.push(`/painel/eventos/${evento.id}/inscricoes`)
                        }
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Inscrições
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


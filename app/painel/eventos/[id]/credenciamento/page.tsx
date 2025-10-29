"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  UserCheck,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  User,
  GraduationCap,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
}

interface Orientador {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  escola: string;
  presente: boolean;
}

interface Participante {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  ouvinte: boolean;
  presente: boolean;
}

interface InscricaoEvento {
  id: string;
  nomeEquipe: string;
  status: string;
  orientador: Orientador;
  participantesEventos: Participante[];
  modalidade: {
    nome: string;
  };
}

export default function CredenciamentoPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados do evento e inscrições
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);

        // Carregar evento
        const eventoResponse = await fetch(`/api/eventos/${eventoId}`);
        if (eventoResponse.ok) {
          const eventoData = await eventoResponse.json();
          setEvento(eventoData.evento);
        }

        // Carregar inscrições com presença
        const inscricoesResponse = await fetch(
          `/api/eventos/${eventoId}/inscricoes`
        );
        if (inscricoesResponse.ok) {
          const inscricoesData = await inscricoesResponse.json();
          setInscricoes(inscricoesData.inscricoes);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do evento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (eventoId) {
      carregarDados();
    }
  }, [eventoId]);

  // Atualizar presença do orientador
  const atualizarPresencaOrientador = async (
    inscricaoId: string,
    presente: boolean
  ) => {
    try {
      const response = await fetch(`/api/eventos/credenciamento/orientador`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscricaoId, presente }),
      });

      if (response.ok) {
        setInscricoes((prev) =>
          prev.map((inscricao) =>
            inscricao.id === inscricaoId
              ? {
                  ...inscricao,
                  orientador: { ...inscricao.orientador, presente },
                }
              : inscricao
          )
        );

        toast({
          title: "Presença atualizada",
          description: `Orientador ${
            presente ? "marcado como presente" : "desmarcado"
          }`,
        });
      } else {
        throw new Error("Erro ao atualizar presença");
      }
    } catch (error) {
      console.error("Erro ao atualizar presença do orientador:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença do orientador",
        variant: "destructive",
      });
    }
  };

  // Atualizar presença do participante
  const atualizarPresencaParticipante = async (
    participanteId: string,
    presente: boolean
  ) => {
    try {
      const response = await fetch(`/api/eventos/credenciamento/participante`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participanteId, presente }),
      });

      if (response.ok) {
        setInscricoes((prev) =>
          prev.map((inscricao) => ({
            ...inscricao,
            participantes: inscricao.participantesEventos?.map((participante) =>
              participante.id === participanteId
                ? { ...participante, presente }
                : participante
            ),
          }))
        );

        toast({
          title: "Presença atualizada",
          description: `Participante ${
            presente ? "marcado como presente" : "desmarcado"
          }`,
        });
      } else {
        throw new Error("Erro ao atualizar presença");
      }
    } catch (error) {
      console.error("Erro ao atualizar presença do participante:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença do participante",
        variant: "destructive",
      });
    }
  };

  // Marcar todos como presentes
  const marcarTodosPresentes = async () => {
    setIsSaving(true);
    try {
      const promises = inscricoes.flatMap((inscricao) => [
        // Orientador
        fetch(`/api/eventos/credenciamento/orientador`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inscricaoId: inscricao.id, presente: true }),
        }),
        // Participantes
        ...inscricao.participantesEventos?.map((participante) =>
          fetch(`/api/eventos/credenciamento/participante`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participanteId: participante.id,
              presente: true,
            }),
          })
        ),
      ]);

      await Promise.all(promises);

      // Atualizar estado local
      setInscricoes((prev) =>
        prev.map((inscricao) => ({
          ...inscricao,
          orientador: { ...inscricao.orientador, presente: true },
          participantes: inscricao.participantesEventos?.map((p) => ({
            ...p,
            presente: true,
          })),
        }))
      );

      toast({
        title: "Sucesso",
        description: "Todos foram marcados como presentes",
      });
    } catch (error) {
      console.error("Erro ao marcar todos como presentes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todos como presentes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do credenciamento...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Evento não encontrado
          </h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const totalOrientadores = inscricoes.length;
  const orientadoresPresentes = inscricoes.filter(
    (i) => i.orientador.presente
  ).length;
  const totalParticipantes = inscricoes.reduce(
    (acc, i) => acc + (i.participantesEventos?.length || 0),
    0
  );
  const participantesPresentes = inscricoes.reduce(
    (acc, i) =>
      acc + (i.participantesEventos?.filter((p) => p.presente).length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Credenciamento
                </h1>
                <p className="text-gray-600">{evento.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={marcarTodosPresentes}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Marcar Todos Presentes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Orientadores
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {orientadoresPresentes}/{totalOrientadores}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Participantes
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {participantesPresentes}/{totalParticipantes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Equipes</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {inscricoes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Presença Total
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {orientadoresPresentes + participantesPresentes}/
                    {totalOrientadores + totalParticipantes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Equipes */}
        <div className="space-y-6">
          {inscricoes.map((inscricao) => (
            <Card key={inscricao.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      {inscricao.nomeEquipe}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {inscricao.modalidade.nome}
                      </Badge>
                      <Badge
                        variant={
                          inscricao.status === "APROVADA"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {inscricao.status}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Orientador */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Orientador
                        </h3>
                        <p className="text-sm text-blue-700">
                          {inscricao.orientador.nome}
                        </p>
                        <p className="text-xs text-blue-600">
                          {inscricao.orientador.escola}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={inscricao.orientador.presente}
                        onCheckedChange={(checked) =>
                          atualizarPresencaOrientador(
                            inscricao.id,
                            checked as boolean
                          )
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-blue-700">
                        {inscricao.orientador.presente ? "Presente" : "Ausente"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participantes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participantes ({inscricao.participantesEventos?.length || 0}
                    )
                  </h3>

                  <div className="grid gap-3">
                    {(inscricao.participantesEventos || []).map(
                      (participante) => (
                        <div
                          key={participante.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-500 rounded-lg">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {participante.nome}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {participante.genero}
                                </span>
                                {participante.ouvinte && (
                                  <Badge variant="outline" className="text-xs">
                                    👂 Ouvinte
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={participante.presente}
                              onCheckedChange={(checked) =>
                                atualizarPresencaParticipante(
                                  participante.id,
                                  checked as boolean
                                )
                              }
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {participante.presente ? "Presente" : "Ausente"}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {inscricoes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Nenhuma inscrição encontrada
                </h3>
                <p className="text-gray-600">
                  Não há equipes inscritas neste evento ainda.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

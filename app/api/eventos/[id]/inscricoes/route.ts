import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventoId } = await params;
    console.log("Buscando inscrições para evento:", eventoId);

    // Buscar dados do evento principal que já inclui as inscrições
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/eventos/${eventoId}`
    );
    if (!response.ok) {
      throw new Error("Erro ao buscar dados do evento");
    }

    const data = await response.json();
    const inscricoesEventos = data.evento.inscricoesEventos || [];

    console.log("Inscrições encontradas:", inscricoesEventos.length);

    // Transformar dados para o formato esperado pelo frontend
    const inscricoesFormatadas = inscricoesEventos.map((inscricao: any) => ({
      id: inscricao.id,
      nomeEquipe: inscricao.nomeEquipe || "Equipe sem nome",
      status: inscricao.status,
      orientador: {
        id: inscricao.orientador?.id || "",
        nome: inscricao.orientador?.nome || "Orientador não encontrado",
        cpf: inscricao.orientador?.cpf || "",
        email: inscricao.orientador?.email || "",
        telefone: inscricao.orientador?.telefone || "",
        escola: inscricao.orientador?.escola || "",
        presente: inscricao.orientador?.presente || false,
      },
      modalidade: {
        nome: inscricao.modalidade?.nome || "Modalidade não encontrada",
      },
      participantesEventos: (inscricao.participantesEventos || []).map(
        (participante: any) => ({
          id: participante.id,
          nome: participante.nome,
          cpf: participante.cpf,
          dataNascimento: participante.dataNascimento,
          genero: participante.genero,
          ouvinte: participante.ouvinte || false,
          presente: participante.presente || false,
        })
      ),
    }));

    console.log("Inscrições formatadas:", inscricoesFormatadas.length);

    return NextResponse.json({
      inscricoes: inscricoesFormatadas,
    });
  } catch (error) {
    console.error("Erro ao buscar inscrições do evento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

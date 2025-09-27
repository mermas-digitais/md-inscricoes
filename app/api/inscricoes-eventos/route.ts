import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get("eventoId");
    const orientadorId = searchParams.get("orientadorId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Construir filtros
    const where: any = {};

    if (eventoId) {
      where.eventoId = eventoId;
    }

    if (orientadorId) {
      where.orientadorId = orientadorId;
    }

    if (status) {
      where.status = status;
    }

    // Buscar inscrições
    const inscricoes = await prisma.inscricoesEventos.findMany({
      where,
      include: {
        evento: {
          select: {
            id: true,
            nome: true,
            dataInicio: true,
            dataFim: true,
          },
        },
        orientador: {
          select: {
            id: true,
            nome: true,
            email: true,
            escola: true,
          },
        },
        modalidade: {
          select: {
            id: true,
            nome: true,
            limiteVagas: true,
            vagasOcupadas: true,
          },
        },
        participantesEventos: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            dataNascimento: true,
            email: true,
            genero: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ inscricoes });
  } catch (error) {
    console.error("Error fetching inscricoes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventoId,
      orientadorId,
      modalidadeId,
      participantes = [],
      observacoes,
    } = body;

    if (!eventoId || !orientadorId || !modalidadeId || !participantes.length) {
      return NextResponse.json(
        {
          error:
            "Evento, orientador, modalidade e participantes são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Verificar se o evento existe e está ativo
    const evento = await prisma.eventos.findFirst({
      where: {
        id: eventoId,
        ativo: true,
      },
    });

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // Verificar se a modalidade existe e tem vagas
    const modalidade = await prisma.modalidades.findFirst({
      where: {
        id: modalidadeId,
        eventoId: eventoId,
        ativo: true,
      },
    });

    if (!modalidade) {
      return NextResponse.json(
        { error: "Modalidade não encontrada" },
        { status: 404 }
      );
    }

    // Verificar vagas disponíveis
    const vagasDisponiveis = modalidade.limiteVagas - modalidade.vagasOcupadas;
    if (participantes.length > vagasDisponiveis) {
      return NextResponse.json(
        { error: `Apenas ${vagasDisponiveis} vagas disponíveis` },
        { status: 400 }
      );
    }

    // Verificar se o orientador existe
    const orientador = await prisma.orientadores.findFirst({
      where: {
        id: orientadorId,
        ativo: true,
      },
    });

    if (!orientador) {
      return NextResponse.json(
        { error: "Orientador não encontrado" },
        { status: 404 }
      );
    }

    // Criar inscrição com participantes
    const inscricao = await prisma.inscricoesEventos.create({
      data: {
        eventoId,
        orientadorId,
        modalidadeId,
        status: "PENDENTE",
        observacoes,
        participantesEventos: {
          create: participantes.map((participante: any) => ({
            nome: participante.nome,
            cpf: participante.cpf,
            dataNascimento: new Date(participante.dataNascimento),
            email: participante.email,
            genero: participante.genero,
          })),
        },
      },
      include: {
        evento: true,
        orientador: true,
        modalidade: true,
        participantesEventos: true,
      },
    });

    // Atualizar vagas ocupadas na modalidade
    await prisma.modalidades.update({
      where: { id: modalidadeId },
      data: {
        vagasOcupadas: modalidade.vagasOcupadas + participantes.length,
      },
    });

    return NextResponse.json(
      {
        message: "Inscrição criada com sucesso",
        inscricao,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating inscricao:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

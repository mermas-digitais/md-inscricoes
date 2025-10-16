import { type NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventoId = searchParams.get("eventoId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    const dbClient = await getDatabaseClient();

    // Construir filtros
    const where: any = {};

    if (eventoId) {
      where.eventoId = eventoId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          orientador: {
            nome: { contains: search, mode: "insensitive" },
          },
        },
        {
          orientador: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          orientador: {
            escola: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Buscar inscrições
    const inscricoes = await dbClient.query("inscricoesEventos", {
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
            telefone: true,
            escola: true,
          },
        },
        modalidade: {
          select: {
            id: true,
            nome: true,
            descricao: true,
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
      status = "PENDENTE",
      observacoes,
      participantes = [],
    } = body;

    if (!eventoId || !orientadorId || !modalidadeId) {
      return NextResponse.json(
        { error: "Evento, orientador e modalidade são obrigatórios" },
        { status: 400 }
      );
    }

    if (participantes.length === 0) {
      return NextResponse.json(
        { error: "Pelo menos um participante é obrigatório" },
        { status: 400 }
      );
    }

    const dbClient = await getDatabaseClient();

    // Verificar se a modalidade existe e tem vagas disponíveis
    const modalidade = await dbClient.query("modalidades", {
      where: { id: modalidadeId },
      select: {
        id: true,
        limiteVagas: true,
        vagasOcupadas: true,
        ativo: true,
      },
    });

    if (!modalidade) {
      return NextResponse.json(
        { error: "Modalidade não encontrada" },
        { status: 404 }
      );
    }

    if (!modalidade.ativo) {
      return NextResponse.json(
        { error: "Modalidade não está ativa" },
        { status: 400 }
      );
    }

    if (
      modalidade.vagasOcupadas + participantes.length >
      modalidade.limiteVagas
    ) {
      return NextResponse.json(
        { error: "Não há vagas suficientes na modalidade" },
        { status: 400 }
      );
    }

    // Verificar se o orientador já tem inscrição nesta modalidade
    const inscricaoExistente = await dbClient.query("inscricoesEventos", {
      where: {
        orientadorId,
        modalidadeId,
      },
      select: { id: true },
    });

    if (inscricaoExistente) {
      return NextResponse.json(
        { error: "Orientador já possui inscrição nesta modalidade" },
        { status: 400 }
      );
    }

    // Criar inscrição
    const inscricao = await dbClient.create("inscricoesEventos", {
      data: {
        eventoId,
        orientadorId,
        modalidadeId,
        status,
        observacoes,
      },
    });

    // Criar participantes
    const participantesCriados = [];
    for (const participante of participantes) {
      const participanteCriado = await dbClient.create("participantesEventos", {
        data: {
          inscricaoId: inscricao.id,
          nome: participante.nome,
          cpf: participante.cpf,
          dataNascimento: participante.dataNascimento,
          email: participante.email,
          genero: participante.genero,
        },
      });
      participantesCriados.push(participanteCriado);
    }

    // Atualizar vagas ocupadas na modalidade
    await dbClient.update("modalidades", {
      where: { id: modalidadeId },
      data: {
        vagasOcupadas: modalidade.vagasOcupadas + participantes.length,
      },
    });

    return NextResponse.json(
      {
        message: "Inscrição criada com sucesso",
        inscricao: {
          ...inscricao,
          participantesEventos: participantesCriados,
        },
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

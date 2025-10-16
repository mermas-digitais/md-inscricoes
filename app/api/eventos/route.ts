import { type NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const limit = parseInt(searchParams.get("limit") || "50");
    const stats = searchParams.get("stats");

    const dbClient = await getDatabaseClient();

    // Se for requisição de estatísticas
    if (stats === "true") {
      const [
        totalEventos,
        eventosAtivos,
        totalInscricoes,
        totalParticipantes,
        orientadoresAtivos,
        modalidadesAtivas,
      ] = await Promise.all([
        dbClient.query("eventos", { select: { id: true } }),
        dbClient.query("eventos", {
          where: { ativo: true },
          select: { id: true },
        }),
        dbClient.query("inscricoesEventos", { select: { id: true } }),
        dbClient.query("participantesEventos", { select: { id: true } }),
        dbClient.query("orientadores", {
          where: { ativo: true },
          select: { id: true },
        }),
        dbClient.query("modalidades", {
          where: { ativo: true },
          select: { id: true },
        }),
      ]);

      return NextResponse.json({
        stats: {
          totalEventos: totalEventos.length,
          eventosAtivos: eventosAtivos.length,
          totalInscricoes: totalInscricoes.length,
          totalParticipantes: totalParticipantes.length,
          orientadoresAtivos: orientadoresAtivos.length,
          modalidadesAtivas: modalidadesAtivas.length,
        },
      });
    }

    // Construir filtros
    const where: any = {};

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    // Buscar eventos
    const eventos = await dbClient.query("eventos", {
      where,
      orderBy: {
        dataInicio: "desc",
      },
      take: limit,
    });

    // Para cada evento, buscar modalidades e contagem de inscrições
    const eventosComDetalhes = await Promise.all(
      eventos.map(async (evento: any) => {
        // Buscar modalidades do evento
        const modalidades = await dbClient.query("modalidades", {
          where: { eventoId: evento.id, ativo: true },
        });

        // Buscar contagem de inscrições
        const inscricoes = await dbClient.query("inscricoesEventos", {
          where: { eventoId: evento.id },
        });

        return {
          ...evento,
          modalidades,
          _count: {
            inscricoesEventos: inscricoes.length,
          },
        };
      })
    );

    return NextResponse.json({ eventos: eventosComDetalhes });
  } catch (error) {
    console.error("Error fetching events:", error);
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
      nome,
      descricao,
      dataInicio,
      dataFim,
      ativo = true,
      modalidades = [],
    } = body;

    if (!nome || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Nome, data de início e data de fim são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar datas
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (inicio >= fim) {
      return NextResponse.json(
        { error: "Data de início deve ser anterior à data de fim" },
        { status: 400 }
      );
    }

    const dbClient = await getDatabaseClient();

    // Criar evento
    const evento = await dbClient.create("eventos", {
      data: {
        nome,
        descricao,
        dataInicio: inicio,
        dataFim: fim,
        ativo,
      },
    });

    // Criar modalidades separadamente
    const modalidadesCriadas = await Promise.all(
      modalidades.map((modalidade: any) =>
        dbClient.create("modalidades", {
          data: {
            eventoId: evento.id,
            nome: modalidade.nome,
            descricao: modalidade.descricao,
            limiteVagas: modalidade.limiteVagas || 0,
            vagasOcupadas: 0,
            ativo: true,
          },
        })
      )
    );

    // Retornar evento com modalidades
    const eventoCompleto = {
      ...evento,
      modalidades: modalidadesCriadas,
    };

    return NextResponse.json(
      {
        message: "Evento criado com sucesso",
        evento: eventoCompleto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbClient = await getDatabaseClient();

    // Buscar evento com modalidades e inscrições
    const evento = await dbClient.query("eventos", {
      where: { id },
      include: {
        modalidades: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            descricao: true,
            limiteVagas: true,
            vagasOcupadas: true,
            ativo: true,
          },
        },
        inscricoesEventos: {
          include: {
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
        },
        _count: {
          select: {
            inscricoesEventos: true,
          },
        },
      },
    });

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ evento });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nome,
      descricao,
      dataInicio,
      dataFim,
      ativo,
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

    // Atualizar evento
    const evento = await dbClient.update("eventos", {
      where: { id },
      data: {
        nome,
        descricao,
        dataInicio: inicio,
        dataFim: fim,
        ativo,
        updatedAt: new Date(),
      },
    });

    // Atualizar modalidades se fornecidas
    if (modalidades.length > 0) {
      // Primeiro, desativar modalidades existentes
      await dbClient.updateMany("modalidades", {
        where: { eventoId: id },
        data: { ativo: false },
      });

      // Criar/atualizar modalidades
      for (const modalidade of modalidades) {
        if (modalidade.id) {
          // Atualizar modalidade existente
          await dbClient.update("modalidades", {
            where: { id: modalidade.id },
            data: {
              nome: modalidade.nome,
              descricao: modalidade.descricao,
              limiteVagas: modalidade.limiteVagas,
              ativo: true,
              updatedAt: new Date(),
            },
          });
        } else {
          // Criar nova modalidade
          await dbClient.create("modalidades", {
            data: {
              eventoId: id,
              nome: modalidade.nome,
              descricao: modalidade.descricao,
              limiteVagas: modalidade.limiteVagas,
              vagasOcupadas: 0,
              ativo: true,
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: "Evento atualizado com sucesso",
      evento,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbClient = await getDatabaseClient();

    // Verificar se o evento tem inscrições
    const inscricoes = await dbClient.query("inscricoesEventos", {
      where: { eventoId: id },
      select: { id: true },
    });

    if (inscricoes.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um evento que possui inscrições" },
        { status: 400 }
      );
    }

    // Excluir evento (modalidades serão excluídas em cascata)
    await dbClient.delete("eventos", {
      where: { id },
    });

    return NextResponse.json({
      message: "Evento excluído com sucesso",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

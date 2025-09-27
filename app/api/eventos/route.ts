import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Construir filtros
    const where: any = {};

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    // Buscar eventos com modalidades
    const eventos = await prisma.eventos.findMany({
      where,
      include: {
        modalidades: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            descricao: true,
            limiteVagas: true,
            vagasOcupadas: true,
          },
        },
        _count: {
          select: {
            inscricoesEventos: true,
          },
        },
      },
      orderBy: {
        dataInicio: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ eventos });
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

    // Criar evento com modalidades
    const evento = await prisma.eventos.create({
      data: {
        nome,
        descricao,
        dataInicio: inicio,
        dataFim: fim,
        ativo,
        modalidades: {
          create: modalidades.map((modalidade: any) => ({
            nome: modalidade.nome,
            descricao: modalidade.descricao,
            limiteVagas: modalidade.limiteVagas || 0,
            vagasOcupadas: 0,
            ativo: true,
          })),
        },
      },
      include: {
        modalidades: true,
      },
    });

    return NextResponse.json(
      {
        message: "Evento criado com sucesso",
        evento,
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

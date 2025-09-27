import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const rede = searchParams.get("rede");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Construir filtros
    const where: any = {};

    if (rede && rede.trim().length > 0) {
      where.rede = rede.trim();
    }

    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      where.nome = {
        contains: searchTerm,
        mode: "insensitive",
      };
    }

    // Buscar escolas com Prisma
    const escolas = await prisma.escolas.findMany({
      where,
      select: {
        id: true,
        nome: true,
        rede: true,
        publica: true,
        uf: true,
        municipio: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: limit,
    });

    return NextResponse.json({ escolas });
  } catch (error) {
    console.error("Error searching schools with Prisma:", error);
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
      rede,
      publica = true,
      uf = "MA",
      municipio = "Imperatriz",
    } = body;

    if (!nome || !rede || !uf || !municipio) {
      return NextResponse.json(
        { error: "Nome, rede, uf e municipio são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a escola já existe
    const escolaExistente = await prisma.escolas.findFirst({
      where: { nome },
    });

    if (escolaExistente) {
      return NextResponse.json({ error: "Escola já existe" }, { status: 409 });
    }

    // Criar nova escola
    const novaEscola = await prisma.escolas.create({
      data: {
        nome,
        rede,
        publica,
        uf,
        municipio,
      },
    });

    return NextResponse.json(
      {
        message: "Escola criada com sucesso",
        escola: novaEscola,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating school with Prisma:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

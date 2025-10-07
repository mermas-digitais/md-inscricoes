import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const escola = searchParams.get("escola");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Construir filtros
    const where: any = {};

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    if (escola && escola.trim().length > 0) {
      where.escola = {
        contains: escola.trim(),
        mode: "insensitive",
      };
    }

    // Buscar orientadores
    const orientadores = await prisma.orientadores.findMany({
      where,
      include: {
        _count: {
          select: {
            inscricoesEventos: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
      take: limit,
    });

    return NextResponse.json({ orientadores });
  } catch (error) {
    console.error("Error fetching orientadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, cpf, telefone, email, escola, genero, ativo = true } = body;

    if (!nome || !cpf || !telefone || !email || !escola || !genero) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar gênero
    const generosValidos = [
      "Masculino",
      "Feminino",
      "Outro",
      "Prefiro não informar",
    ];
    if (!generosValidos.includes(genero)) {
      return NextResponse.json({ error: "Gênero inválido" }, { status: 400 });
    }

    // Verificar se CPF já existe
    const cpfExistente = await prisma.orientadores.findFirst({
      where: { cpf },
    });

    if (cpfExistente) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
    }

    // Verificar se email já existe
    const emailExistente = await prisma.orientadores.findFirst({
      where: { email },
    });

    if (emailExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Criar orientador
    const orientador = await prisma.orientadores.create({
      data: {
        nome,
        cpf,
        telefone,
        email,
        escola,
        genero,
        ativo,
      },
    });

    return NextResponse.json(
      {
        message: "Orientador criado com sucesso",
        orientador,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating orientador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

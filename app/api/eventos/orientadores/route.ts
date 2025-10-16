import { type NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    const dbClient = await getDatabaseClient();

    // Construir filtros
    const where: any = {};

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { escola: { contains: search, mode: "insensitive" } },
      ];
    }

    // Buscar orientadores
    const orientadores = await dbClient.query("orientadores", {
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
      "feminino",
      "masculino",
      "nao-binario",
      "transgenero",
      "outro",
      "prefiro_nao_informar",
    ];
    if (!generosValidos.includes(genero)) {
      return NextResponse.json({ error: "Gênero inválido" }, { status: 400 });
    }

    const dbClient = await getDatabaseClient();

    // Verificar se CPF já existe
    const cpfExistente = await dbClient.query("orientadores", {
      where: { cpf },
      select: { id: true },
    });

    if (cpfExistente) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
    }

    // Verificar se email já existe
    const emailExistente = await dbClient.query("orientadores", {
      where: { email },
      select: { id: true },
    });

    if (emailExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Criar orientador
    const orientador = await dbClient.create("orientadores", {
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

import { type NextRequest, NextResponse } from "next/server";
import { escolasService } from "@/lib/services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tipo = searchParams.get("tipo");
    const rede = searchParams.get("rede");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Use the service to find schools
    const result = await escolasService.findEscolas({
      search: search || undefined,
      tipo: tipo || undefined,
      rede: rede || undefined,
      limit,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao buscar escolas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      escolas: result.data,
      total: result.total,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Error searching schools:", error);
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

    // Use the service to create school
    const result = await escolasService.createEscola({
      nome,
      rede,
      publica,
      uf,
      municipio,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao criar escola" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Escola criada com sucesso",
        escola: result.data?.[0],
        provider: result.provider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

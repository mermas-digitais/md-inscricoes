import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function PATCH(request: NextRequest) {
  try {
    const { inscricaoId, presente } = await request.json();

    if (!inscricaoId || typeof presente !== "boolean") {
      return NextResponse.json(
        { error: "inscricaoId e presente são obrigatórios" },
        { status: 400 }
      );
    }

    const dbClient = await getDatabaseClient();

    // Atualizar presença do orientador na inscrição
    const inscricao = await dbClient.update("inscricoes_eventos", inscricaoId, {
      orientador_presente: presente,
    });

    if (!inscricao) {
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Presença do orientador atualizada com sucesso",
      inscricao,
    });
  } catch (error) {
    console.error("Erro ao atualizar presença do orientador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}


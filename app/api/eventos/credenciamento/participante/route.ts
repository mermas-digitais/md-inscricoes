import { NextRequest, NextResponse } from "next/server";
import { getDatabaseClient } from "@/lib/clients";

export async function PATCH(request: NextRequest) {
  try {
    const { participanteId, presente } = await request.json();

    if (!participanteId || typeof presente !== "boolean") {
      return NextResponse.json(
        { error: "participanteId e presente são obrigatórios" },
        { status: 400 }
      );
    }

    const dbClient = await getDatabaseClient();

    // Atualizar presença do participante
    const participante = await dbClient.update(
      "participantes_eventos",
      participanteId,
      {
        presente: presente,
      }
    );

    if (!participante) {
      return NextResponse.json(
        { error: "Participante não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Presença do participante atualizada com sucesso",
      participante,
    });
  } catch (error) {
    console.error("Erro ao atualizar presença do participante:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}


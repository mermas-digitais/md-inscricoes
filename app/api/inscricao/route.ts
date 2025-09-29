import { type NextRequest, NextResponse } from "next/server";
import { inscricoesService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check if registration is still open
    const deadline = process.env.REGISTRATION_DEADLINE;
    if (deadline && new Date() > new Date(deadline)) {
      return NextResponse.json(
        { error: "Inscrições encerradas" },
        { status: 400 }
      );
    }

    // Use the service to create inscription
    const result = await inscricoesService.createInscricao(data, false);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao criar inscrição" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      curso: result.curso,
      status: result.status,
    });
  } catch (error) {
    console.error("Error creating inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

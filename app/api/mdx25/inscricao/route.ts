import { type NextRequest, NextResponse } from "next/server";
import { inscricoesService } from "@/lib/services/inscricoes-service";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Usar o serviço de inscrições com flag MDX25
    const result = await inscricoesService.createInscricao(data, true);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      curso: result.curso,
      status: result.status,
      message: "Inscrição MDX25 realizada com sucesso!",
      provider: result.provider,
    });
  } catch (error) {
    console.error("Error creating MDX25 inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

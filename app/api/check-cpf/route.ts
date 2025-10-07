import { NextRequest, NextResponse } from "next/server";
import { inscricoesService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Use the service to check CPF
    const result = await inscricoesService.checkCPFExists(cpf, false);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      exists: result.exists,
    });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

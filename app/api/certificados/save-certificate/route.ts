import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST - Salvar certificado no banco
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alunaId, templateUrl, posicoes, fontes, dataConclusao } = body;

    if (!alunaId) {
      return NextResponse.json(
        { error: "ID da aluna é obrigatório" },
        { status: 400 }
      );
    }

    // Por enquanto, vamos apenas logar os dados
    // Você pode implementar a lógica de banco aqui
    console.log("Salvando certificado:", {
      alunaId,
      templateUrl,
      posicoes,
      fontes,
      dataConclusao,
    });

    return NextResponse.json({
      success: true,
      message: "Certificado salvo com sucesso",
    });
  } catch (error) {
    console.error("Erro ao salvar certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

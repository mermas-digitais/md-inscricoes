import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Função para executar SQL direto no banco
async function executeSQL(query: string, params: any[] = []) {
  // Esta função será implementada usando a conexão existente do projeto
  // Por enquanto, vamos usar uma abordagem mais simples
  return { rows: [] };
}

// GET - Buscar dados das alunas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alunaIds } = body;

    if (!alunaIds || !Array.isArray(alunaIds) || alunaIds.length === 0) {
      return NextResponse.json(
        { error: "IDs das alunas são obrigatórios" },
        { status: 400 }
      );
    }

    // Por enquanto, vamos retornar dados mockados para teste
    // Você pode substituir isso pela sua lógica de banco existente
    const mockData = [
      {
        id: alunaIds[0],
        nome: "Maria Silva",
        cpf: "12345678901",
        email: "maria@email.com",
        curso: "Programação",
        data_conclusao: null,
        carga_horaria: 40,
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error("Erro ao buscar dados das alunas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

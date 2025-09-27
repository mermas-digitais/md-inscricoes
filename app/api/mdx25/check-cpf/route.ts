import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json();

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Formatar CPF para comparação (XXX.XXX.XXX-XX)
    const formatCPF = (cpf: string) => {
      const numbers = cpf.replace(/\D/g, "");
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };

    const formattedCPF = formatCPF(cpf);

    // TODO: Verificar se o CPF já existe na base de dados MDX25
    // For now, we'll return false (CPF doesn't exist)
    // In the real implementation, you would:
    // 1. Connect to the MDX25 PostgreSQL database
    // 2. Query the inscricoes_mdx25 table
    // 3. Check if the CPF already exists

    console.log(`MDX25 CPF check for: ${formattedCPF}`);

    // Temporary response - in production, this should come from the database
    return NextResponse.json({
      exists: false, // TODO: Replace with actual database query
    });
  } catch (error) {
    console.error("Erro ao verificar CPF MDX25:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

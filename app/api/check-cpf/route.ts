import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Verificar se o CPF já existe na base de dados
    const { data, error } = await supabase
      .from("inscricoes")
      .select("id")
      .eq("cpf", formattedCPF)
      .limit(1);

    if (error) {
      console.error("Erro ao verificar CPF:", error);
      return NextResponse.json(
        { error: "Erro ao verificar CPF" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: data && data.length > 0,
    });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

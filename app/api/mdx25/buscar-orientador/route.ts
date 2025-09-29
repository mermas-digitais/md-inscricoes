import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { cpf } = await request.json();
    console.log("API: Buscando orientador com CPF:", cpf);

    if (!cpf || typeof cpf !== "string" || cpf.length !== 11) {
      console.log("API: CPF inválido");
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Buscar orientador pelo CPF (tanto formatado quanto sem formatação)
    const cpfFormatado = cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );

    console.log("API: Buscando CPF sem formatação:", cpf);
    console.log("API: Buscando CPF formatado:", cpfFormatado);

    const { data: orientador, error } = await supabase
      .from("orientadores")
      .select("*")
      .or(`cpf.eq.${cpf},cpf.eq.${cpfFormatado}`)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("API: Erro ao buscar orientador:", error);
      return NextResponse.json(
        { error: "Erro ao buscar orientador" },
        { status: 500 }
      );
    }

    console.log("API: Orientador encontrado:", orientador);

    if (orientador) {
      return NextResponse.json(orientador);
    } else {
      return NextResponse.json(null);
    }
  } catch (error) {
    console.error("Erro ao buscar orientador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

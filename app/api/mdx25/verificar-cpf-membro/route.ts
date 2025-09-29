import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json();

    if (!cpf || cpf.length !== 11) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // Verificar se o CPF já está sendo usado em alguma equipe (tanto formatado quanto sem formatação)
    const cpfFormatado = cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );

    const { data: membroExistente, error } = await supabase
      .from("participantes_eventos")
      .select(
        `
        *,
        inscricoes_eventos!inner(
          *,
          orientadores!inner(
            nome
          )
        )
      `
      )
      .or(`cpf.eq.${cpf},cpf.eq.${cpfFormatado}`)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao verificar CPF:", error);
      return NextResponse.json(
        { error: "Erro ao verificar CPF" },
        { status: 500 }
      );
    }

    if (membroExistente) {
      return NextResponse.json({
        existe: true,
        mensagem: "Este CPF já está sendo usado em outra equipe",
        equipe: membroExistente.inscricoes_eventos.orientadores.nome,
      });
    }

    return NextResponse.json({
      existe: false,
      mensagem: "CPF disponível",
    });
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

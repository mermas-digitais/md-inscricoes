import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  req: NextRequest,
  { params }: { params: { cpf: string } }
) {
  const { cpf } = params;

  if (!cpf) {
    return NextResponse.json({ message: "CPF é obrigatório" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("inscricoes")
      .select("nome, nome_responsavel, cpf")
      .eq("cpf", decodeURIComponent(cpf))
      .single();

    if (error || !data) {
      throw new Error("Inscrição não encontrada ou erro na busca.");
    }

    return NextResponse.json({
      nomeParticipante: data.nome,
      nomeResponsavel: data.nome_responsavel,
      cpfResponsavel: data.cpf,
    });
  } catch (error: any) {
    console.error("Erro ao buscar inscrição por CPF:", error);
    return NextResponse.json(
      { message: "Inscrição não encontrada.", error: error.message },
      { status: 404 }
    );
  }
}

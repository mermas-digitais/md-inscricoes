import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("inscricoes")
      .select("id, nome, curso, status, cpf")
      .in("status", ["INSCRITA", "EXCEDENTE"])
      .order("status", { ascending: false }) // Ordem: INSCRITA (Aprovada), EXCEDENTE
      .order("nome", { ascending: true }); // Ordem alfabética

    if (error) {
      throw error;
    }

    const resultados = data.map((item) => ({
      ...item,
      curso:
        item.curso === "Robótica"
          ? "Robótica (Ensino Médio)"
          : "Jogos (Ensino Fundamental)",
      status: item.status === "INSCRITA" ? "Aprovada" : "Excedente",
    }));

    return NextResponse.json(resultados);
  } catch (error: any) {
    console.error("Erro ao buscar resultados:", error);
    return NextResponse.json(
      { message: "Erro ao buscar resultados.", error: error.message },
      { status: 500 }
    );
  }
}

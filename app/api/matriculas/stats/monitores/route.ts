import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os monitores para estatísticas
    const { data: monitores, error } = await supabase
      .from("monitores")
      .select("id, nome, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching monitores stats:", error);
      return NextResponse.json(
        { error: "Erro ao buscar dados dos monitores" },
        { status: 500 }
      );
    }

    return NextResponse.json(monitores);
  } catch (error) {
    console.error("Error in monitores stats API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

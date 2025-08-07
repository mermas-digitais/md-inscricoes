import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tipo = searchParams.get("tipo"); // Novo parâmetro para filtro por tipo
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase.from("escolas").select("id, nome, tipo").order("nome");

    // Se há filtro por tipo, aplicar
    if (tipo && tipo.trim().length > 0) {
      query = query.eq("tipo", tipo.trim());
    }

    // Se há um termo de busca, filtrar por nome
    if (search && search.trim().length > 0) {
      // Usar busca por texto usando ILIKE para busca case-insensitive
      query = query.ilike("nome", `%${search.trim()}%`);
    }

    // Aplicar limite
    query = query.limit(limit);

    const { data: escolas, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar escolas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ escolas });
  } catch (error) {
    console.error("Error searching schools:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Calcular offset
    const offset = (page - 1) * limit;

    // Buscar total de registros para paginação
    const { count, error: countError } = await supabase
      .from("inscricoes")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Erro ao contar inscrições" },
        { status: 500 }
      );
    }

    // Buscar inscrições paginadas
    const { data: inscricoes, error } = await supabase
      .from("inscricoes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar inscrições" },
        { status: 500 }
      );
    }

    // Calcular informações de paginação
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      data: inscricoes,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching inscriptions:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

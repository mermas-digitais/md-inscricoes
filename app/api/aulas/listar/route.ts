import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para verificar autenticação ADM ou MONITOR
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { error: "Token de autorização não fornecido", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");

  // Verificar se é admin ou monitor
  if (
    token !== process.env.ADMIN_ACCESS_TOKEN &&
    token !== process.env.MONITOR_ACCESS_TOKEN
  ) {
    return {
      error:
        "Acesso negado. Apenas administradores e monitores podem acessar este recurso.",
      status: 403,
    };
  }

  return { success: true };
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const turma_id = searchParams.get("turma_id");
    const data_inicio = searchParams.get("data_inicio");
    const data_fim = searchParams.get("data_fim");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = supabase
      .from("aulas")
      .select(
        `
        *,
        turmas (
          id,
          nome_turma,
          cursos (
            id,
            nome_curso
          )
        )
      `
      )
      .order("data_aula", { ascending: false });

    // Filtros opcionais
    if (turma_id) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(turma_id)) {
        return NextResponse.json(
          { error: "ID da turma inválido" },
          { status: 400 }
        );
      }
      query = query.eq("turma_id", turma_id);
    }

    if (data_inicio) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data_inicio)) {
        return NextResponse.json(
          { error: "Data de início deve estar no formato YYYY-MM-DD" },
          { status: 400 }
        );
      }
      query = query.gte("data_aula", data_inicio);
    }

    if (data_fim) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data_fim)) {
        return NextResponse.json(
          { error: "Data de fim deve estar no formato YYYY-MM-DD" },
          { status: 400 }
        );
      }
      query = query.lte("data_aula", data_fim);
    }

    // Contar total de registros para paginação
    const { count, error: countError } = await supabase
      .from("aulas")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting aulas:", countError);
      return NextResponse.json(
        { error: "Erro ao contar aulas" },
        { status: 500 }
      );
    }

    // Aplicar paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: aulas, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar aulas" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: aulas,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: count || 0,
        records_per_page: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching aulas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

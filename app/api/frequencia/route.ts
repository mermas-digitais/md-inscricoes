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
    const aula_id = searchParams.get("aula_id");
    const aluna_id = searchParams.get("aluna_id");
    const turma_id = searchParams.get("turma_id");
    const presente = searchParams.get("presente");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("frequencia")
      .select(
        `
        *,
        aulas (
          id,
          data_aula,
          conteudo_ministrado,
          turmas (
            id,
            nome_turma,
            cursos (
              id,
              nome_curso
            )
          )
        ),
        inscricoes (
          id,
          nome_completo,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    // Filtros opcionais
    if (aula_id) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(aula_id)) {
        return NextResponse.json(
          { error: "ID da aula inválido" },
          { status: 400 }
        );
      }
      query = query.eq("aula_id", aula_id);
    }

    if (aluna_id) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(aluna_id)) {
        return NextResponse.json(
          { error: "ID da aluna inválido" },
          { status: 400 }
        );
      }
      query = query.eq("aluna_id", aluna_id);
    }

    if (presente !== null && presente !== undefined) {
      if (presente === "true") {
        query = query.eq("presente", true);
      } else if (presente === "false") {
        query = query.eq("presente", false);
      }
    }

    // Filtro por turma (via join)
    if (turma_id) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(turma_id)) {
        return NextResponse.json(
          { error: "ID da turma inválido" },
          { status: 400 }
        );
      }
      // Para filtrar por turma, precisa fazer join com aulas
      query = query.eq("aulas.turma_id", turma_id);
    }

    // Contar total de registros para paginação
    const { count, error: countError } = await supabase
      .from("frequencia")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting frequencia:", countError);
      return NextResponse.json(
        { error: "Erro ao contar registros de frequência" },
        { status: 500 }
      );
    }

    // Aplicar paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: frequencia, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar registros de frequência" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: frequencia,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: count || 0,
        records_per_page: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching frequencia:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

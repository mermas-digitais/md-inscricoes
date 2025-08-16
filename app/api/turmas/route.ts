import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode criar turmas)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    const { curso_id, codigo_turma, descricao, ano_letivo, semestre, status } =
      await request.json();

    // Validações obrigatórias
    if (!curso_id) {
      return NextResponse.json(
        { error: "ID do curso é obrigatório" },
        { status: 400 }
      );
    }

    if (!codigo_turma) {
      return NextResponse.json(
        { error: "Código da turma é obrigatório" },
        { status: 400 }
      );
    }

    if (!ano_letivo) {
      return NextResponse.json(
        { error: "Ano letivo é obrigatório" },
        { status: 400 }
      );
    }

    // Validar UUID do curso
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(curso_id)) {
      return NextResponse.json(
        { error: "ID do curso inválido" },
        { status: 400 }
      );
    }

    // Verificar se o curso existe
    const { data: existingCurso, error: checkError } = await supabase
      .from("cursos")
      .select("id")
      .eq("id", curso_id)
      .single();

    if (checkError || !existingCurso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    // Validar ano letivo
    if (
      typeof ano_letivo !== "number" ||
      ano_letivo < 2020 ||
      ano_letivo > 2030
    ) {
      return NextResponse.json(
        { error: "Ano letivo deve ser um número entre 2020 e 2030" },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ["Planejamento", "Ativa", "Concluída", "Cancelada"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Status deve ser um dos seguintes: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Inserir turma no banco
    const { data, error } = await supabase
      .from("turmas")
      .insert({
        curso_id,
        codigo_turma: codigo_turma.trim(),
        descricao: descricao?.trim(),
        ano_letivo,
        semestre: semestre || 1,
        status: status || "Planejamento",
      })
      .select(
        `
        *,
        cursos (
          id,
          nome_curso,
          publico_alvo,
          carga_horaria
        )
      `
      )
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao criar turma" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Turma criada com sucesso",
    });
  } catch (error) {
    console.error("Error creating turma:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Buscar todas as turmas com informações do curso
    const { data: turmas, error } = await supabase
      .from("turmas")
      .select(
        `
        *,
        cursos (
          id,
          nome_curso,
          descricao,
          publico_alvo,
          carga_horaria
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar turmas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: turmas,
      total: turmas.length,
    });
  } catch (error) {
    console.error("Error fetching turmas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

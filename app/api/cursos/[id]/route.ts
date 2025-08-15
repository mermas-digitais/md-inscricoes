import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode buscar curso)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    const { id } = params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID do curso inválido" },
        { status: 400 }
      );
    }

    const { data: curso, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Curso não encontrado" },
          { status: 404 }
        );
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar curso" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: curso,
    });
  } catch (error) {
    console.error("Error fetching curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode atualizar curso)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    const { id } = params;
    const { nome_curso, descricao, carga_horaria, publico_alvo } =
      await request.json();

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID do curso inválido" },
        { status: 400 }
      );
    }

    // Verificar se o curso existe
    const { data: existingCurso, error: checkError } = await supabase
      .from("cursos")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingCurso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (nome_curso && typeof nome_curso !== "string") {
      return NextResponse.json(
        { error: "Nome do curso deve ser uma string" },
        { status: 400 }
      );
    }

    if (
      publico_alvo &&
      !["Ensino Fundamental 2", "Ensino Médio"].includes(publico_alvo)
    ) {
      return NextResponse.json(
        {
          error:
            "Público alvo deve ser 'Ensino Fundamental 2' ou 'Ensino Médio'",
        },
        { status: 400 }
      );
    }

    if (
      carga_horaria &&
      (typeof carga_horaria !== "number" || carga_horaria <= 0)
    ) {
      return NextResponse.json(
        { error: "Carga horária deve ser um número positivo" },
        { status: 400 }
      );
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {};
    if (nome_curso !== undefined) updateData.nome_curso = nome_curso.trim();
    if (descricao !== undefined)
      updateData.descricao = descricao?.trim() || null;
    if (carga_horaria !== undefined)
      updateData.carga_horaria = carga_horaria || null;
    if (publico_alvo !== undefined)
      updateData.publico_alvo = publico_alvo || null;

    // Se nenhum campo foi fornecido para atualização
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido fornecido para atualização" },
        { status: 400 }
      );
    }

    // Atualizar curso no banco
    const { data, error } = await supabase
      .from("cursos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar curso" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Curso atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação ADM (apenas ADM pode excluir cursos)
    const { response: authError } = await requireAuth(request, "ADM");
    if (authError) return authError;

    const { id } = params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID do curso inválido" },
        { status: 400 }
      );
    }

    // Verificar se o curso existe
    const { data: existingCurso, error: checkError } = await supabase
      .from("cursos")
      .select("id, nome_curso")
      .eq("id", id)
      .single();

    if (checkError || !existingCurso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    // Excluir curso (turmas relacionadas serão excluídas automaticamente devido ao CASCADE)
    const { error: deleteError } = await supabase
      .from("cursos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return NextResponse.json(
        { error: "Erro ao excluir curso" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Curso excluído com sucesso",
    });
  } catch (error) {
    console.error("Error deleting curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

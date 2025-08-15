import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode criar cursos)
    const { response: authError, monitor } = await requireAuth(
      request,
      "MONITOR"
    );
    if (authError) return authError;

    const { nome_curso, descricao, carga_horaria, publico_alvo } =
      await request.json();

    // Validações
    if (!nome_curso) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
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

    // Inserir curso no banco
    const { data, error } = await supabase
      .from("cursos")
      .insert({
        nome_curso: nome_curso.trim(),
        descricao: descricao?.trim() || null,
        carga_horaria: carga_horaria || null,
        publico_alvo: publico_alvo || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao criar curso" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Curso criado com sucesso",
    });
  } catch (error) {
    console.error("Error creating curso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode listar cursos)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    // Buscar todos os cursos
    const { data: cursos, error } = await supabase
      .from("cursos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar cursos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cursos,
      total: cursos.length,
    });
  } catch (error) {
    console.error("Error fetching cursos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

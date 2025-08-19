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
    // Verificar autenticação (MONITOR ou ADM pode buscar aulas)
    const authResult = await requireAuth(request, "MONITOR");
    if (authResult.response) return authResult.response;

    const { id: turma_id } = await params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    // Verificar se a turma existe
    const { data: turma, error: turmaError } = await supabase
      .from("turmas")
      .select("id, codigo_turma")
      .eq("id", turma_id)
      .single();

    if (turmaError || !turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Buscar aulas da turma
    const { data: aulas, error: aulasError } = await supabase
      .from("aulas")
      .select(
        `
        id,
        data_aula,
        conteudo_ministrado,
        created_at
      `
      )
      .eq("turma_id", turma_id)
      .order("data_aula", { ascending: false });

    if (aulasError) {
      console.error("Database error:", aulasError);
      return NextResponse.json(
        { error: "Erro ao buscar aulas" },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const totalAulas = aulas?.length || 0;

    // Aulas por mês para estatísticas
    const aulasPorMes =
      aulas?.reduce((acc, aula) => {
        const mes = new Date(aula.data_aula).toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
        });
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      data: {
        turma: {
          id: turma.id,
          codigo_turma: turma.codigo_turma,
        },
        aulas: aulas || [],
        estatisticas: {
          total_aulas: totalAulas,
          aulas_por_mes: aulasPorMes,
          ultima_aula: aulas?.[0]?.data_aula || null,
        },
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

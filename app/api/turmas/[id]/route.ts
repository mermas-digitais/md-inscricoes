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
    // Verificar autenticação (MONITOR ou ADM pode buscar turma)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    const { id } = params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    // Buscar turma com informações do curso
    const { data: turma, error: turmaError } = await supabase
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
      .eq("id", id)
      .single();

    if (turmaError || !turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Buscar alunas vinculadas à turma
    const { data: alunas, error: alunasError } = await supabase
      .from("turmas_alunas")
      .select(
        `
        created_at,
        inscricoes (
          id,
          nome,
          email,
          cpf,
          escolaridade,
          ano_escolar,
          escola,
          cidade,
          estado,
          status
        )
      `
      )
      .eq("turma_id", id);

    if (alunasError) {
      console.error("Error fetching alunas:", alunasError);
    }

    // Buscar monitores vinculados à turma
    const { data: monitores, error: monitoresError } = await supabase
      .from("turmas_monitores")
      .select(
        `
        created_at,
        monitores (
          id,
          nome,
          email,
          funcao
        )
      `
      )
      .eq("turma_id", id);

    if (monitoresError) {
      console.error("Error fetching monitores:", monitoresError);
    }

    // Buscar estatísticas de aulas
    const { data: aulas, error: aulasError } = await supabase
      .from("aulas")
      .select("id, data_aula")
      .eq("turma_id", id);

    if (aulasError) {
      console.error("Error fetching aulas:", aulasError);
    }

    // Preparar resposta com dados organizados
    const turmaDetalhes = {
      ...turma,
      alunas:
        alunas?.map((item) => ({
          ...item.inscricoes,
          data_vinculo: item.created_at,
        })) || [],
      monitores:
        monitores?.map((item) => ({
          ...item.monitores,
          data_vinculo: item.created_at,
        })) || [],
      estatisticas: {
        total_alunas: alunas?.length || 0,
        total_monitores: monitores?.length || 0,
        total_aulas: aulas?.length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: turmaDetalhes,
    });
  } catch (error) {
    console.error("Error fetching turma details:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

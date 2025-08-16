import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode criar aulas)
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    const { turma_id, data_aula, conteudo_ministrado } = await request.json();

    // Validações obrigatórias
    if (!turma_id) {
      return NextResponse.json(
        { error: "ID da turma é obrigatório" },
        { status: 400 }
      );
    }

    if (!data_aula) {
      return NextResponse.json(
        { error: "Data da aula é obrigatória" },
        { status: 400 }
      );
    }

    // Validar UUID da turma
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data_aula)) {
      return NextResponse.json(
        { error: "Data da aula deve estar no formato YYYY-MM-DD" },
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

    // Verificar se já existe uma aula na mesma data para esta turma
    const { data: existingAula, error: existingError } = await supabase
      .from("aulas")
      .select("id")
      .eq("turma_id", turma_id)
      .eq("data_aula", data_aula)
      .single();

    if (existingAula) {
      return NextResponse.json(
        { error: "Já existe uma aula registrada nesta data para esta turma" },
        { status: 409 }
      );
    }

    // Inserir aula no banco
    const { data: aula, error: aulaError } = await supabase
      .from("aulas")
      .insert({
        turma_id,
        data_aula,
        conteudo_ministrado: conteudo_ministrado?.trim() || null,
      })
      .select()
      .single();

    if (aulaError) {
      console.error("Database error:", aulaError);
      return NextResponse.json(
        { error: "Erro ao criar aula" },
        { status: 500 }
      );
    }

    // Buscar todas as alunas da turma para gerar registros de frequência
    const { data: alunas, error: alunasError } = await supabase
      .from("turmas_alunas")
      .select("aluna_id")
      .eq("turma_id", turma_id);

    if (alunasError) {
      console.error("Error fetching alunas:", alunasError);
      return NextResponse.json(
        { error: "Erro ao buscar alunas da turma" },
        { status: 500 }
      );
    }

    // Gerar registros de frequência para todas as alunas (presente = false por padrão)
    if (alunas && alunas.length > 0) {
      const frequenciaRecords = alunas.map((aluna) => ({
        aula_id: aula.id,
        aluna_id: aluna.aluna_id,
        presente: false,
      }));

      const { error: frequenciaError } = await supabase
        .from("frequencia")
        .insert(frequenciaRecords);

      if (frequenciaError) {
        console.error("Error creating frequencia records:", frequenciaError);
        // Não retornar erro aqui, pois a aula foi criada com sucesso
        // Apenas log do erro para investigação
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...aula,
        turma: turma,
        alunas_registradas: alunas?.length || 0,
      },
      message: `Aula criada com sucesso. Registros de frequência criados para ${
        alunas?.length || 0
      } alunas.`,
    });
  } catch (error) {
    console.error("Error creating aula:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

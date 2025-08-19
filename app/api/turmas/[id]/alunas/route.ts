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
    console.log("=== GET /api/turmas/[id]/alunas - Início ===");

    // Verificar autenticação (MONITOR ou ADM pode buscar alunas)
    const authResult = await requireAuth(request, "MONITOR");
    if (authResult.response) return authResult.response;

    const { id: turma_id } = await params;
    console.log("turma_id:", turma_id);

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    // Verificar se a turma existe e buscar informações do curso
    const { data: turma, error: turmaError } = await supabase
      .from("turmas")
      .select(
        `
        id,
        codigo_turma,
        curso_id,
        cursos (
          id,
          nome_curso,
          publico_alvo
        )
      `
      )
      .eq("id", turma_id)
      .single();

    if (turmaError || !turma) {
      console.log("Erro turma:", turmaError);
      console.log("Turma encontrada:", turma);
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    console.log("Turma encontrada:", turma);

    // Buscar alunas já vinculadas à turma para excluir da lista de candidatas
    const { data: alunasVinculadas, error: vinculadasError } = await supabase
      .from("turmas_alunas")
      .select("aluna_id")
      .eq("turma_id", turma_id);

    if (vinculadasError) {
      console.error("Error fetching alunas vinculadas:", vinculadasError);
    }

    const alunasVinculadasIds = alunasVinculadas?.map((v) => v.aluna_id) || [];

    // Buscar alunas candidatas baseado no público alvo do curso
    console.log("Iniciando busca de alunas candidatas...");

    // Primeiro, vamos ver quais status existem na tabela
    const { data: statusCheck } = await supabase
      .from("inscricoes")
      .select("status")
      .limit(10);

    console.log(
      "Status existentes na tabela:",
      statusCheck?.map((s) => s.status)
    );

    // Verificar escolaridades existentes no banco
    const { data: escolaridadeCheck } = await supabase
      .from("inscricoes")
      .select("escolaridade")
      .limit(10);

    console.log(
      "Escolaridades existentes na tabela:",
      escolaridadeCheck?.map((e) => e.escolaridade)
    );

    let query = supabase
      .from("inscricoes")
      .select(
        `
        id,
        nome,
        email,
        cpf,
        escolaridade,
        ano_escolar,
        escola,
        cidade,
        estado,
        status,
        created_at
      `
      )
      .in("status", ["INSCRITA", "MATRICULADA"]);

    console.log("Query inicial montada para status INSCRITA e MATRICULADA");

    // Se há alunas já vinculadas, excluí-las da busca
    if (alunasVinculadasIds.length > 0) {
      query = query.not("id", "in", `(${alunasVinculadasIds.join(",")})`);
    }

    // Filtrar por público alvo do curso se especificado
    const curso = Array.isArray(turma.cursos) ? turma.cursos[0] : turma.cursos;
    console.log("Curso público-alvo:", curso?.publico_alvo);

    if (curso?.publico_alvo) {
      const publicoAlvo = curso.publico_alvo.toLowerCase();
      console.log("Público-alvo lowercase:", publicoAlvo);

      if (publicoAlvo.includes("fundamental")) {
        console.log("Aplicando filtro para Ensino Fundamental");
        query = query.in("escolaridade", [
          "Ensino Fundamental 1",
          "Ensino Fundamental 2",
          "Ensino Fundamental - Anos Iniciais (1º ao 5º ano)",
          "Ensino Fundamental - Anos Finais (6º ao 9º ano)",
          "Ensino Fundamental Completo",
        ]);
      } else if (
        publicoAlvo.includes("médio") ||
        publicoAlvo.includes("medio")
      ) {
        console.log("Aplicando filtro para Ensino Médio");
        query = query.in("escolaridade", [
          "Ensino Médio",
          "Ensino Médio Incompleto",
          "Ensino Médio Completo",
          "Ensino Médio Técnico",
        ]);
      } else if (publicoAlvo.includes("superior")) {
        console.log("Aplicando filtro para Ensino Superior");
        query = query.in("escolaridade", [
          "Ensino Superior",
          "Ensino Superior Incompleto",
          "Ensino Superior Completo",
          "Pós-graduação",
        ]);
      }
    }

    const { data: alunasCandidatas, error: candidatasError } = await query
      .order("nome", { ascending: true })
      .limit(50); // Limitar para não sobrecarregar

    console.log(
      "Query executada - alunasCandidatas:",
      alunasCandidatas?.length || 0
    );
    console.log("Erro candidatas:", candidatasError);

    if (candidatasError) {
      console.error("Database error:", candidatasError);
      return NextResponse.json(
        { error: "Erro ao buscar alunas candidatas" },
        { status: 500 }
      );
    }

    // Buscar alunas já vinculadas à turma
    const { data: alunasVinculadasDetalhes, error: vinculadasDetalhesError } =
      await supabase
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
          status,
          created_at
        )
      `
        )
        .eq("turma_id", turma_id);

    if (vinculadasDetalhesError) {
      console.error(
        "Error fetching alunas vinculadas detalhes:",
        vinculadasDetalhesError
      );
    }

    const alunasVinculadasFormatadas =
      alunasVinculadasDetalhes?.map((item) => ({
        ...item.inscricoes,
        data_vinculo: item.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        turma: {
          id: turma.id,
          codigo_turma: turma.codigo_turma,
          curso: curso,
        },
        alunas_candidatas: alunasCandidatas || [],
        alunas_vinculadas: alunasVinculadasFormatadas,
        estatisticas: {
          total_candidatas: alunasCandidatas?.length || 0,
          total_vinculadas: alunasVinculadasFormatadas.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching alunas candidatas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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

    // Validar parâmetros obrigatórios
    if (!turma_id) {
      return NextResponse.json(
        { error: "ID da turma é obrigatório" },
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

    // Validar datas se fornecidas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (data_inicio && !dateRegex.test(data_inicio)) {
      return NextResponse.json(
        { error: "Data de início deve estar no formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (data_fim && !dateRegex.test(data_fim)) {
      return NextResponse.json(
        { error: "Data de fim deve estar no formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Verificar se a turma existe
    const { data: turma, error: turmaError } = await supabase
      .from("turmas")
      .select(
        `
        id,
        codigo_turma,
        cursos (
          id,
          nome_curso
        )
      `
      )
      .eq("id", turma_id)
      .single();

    if (turmaError || !turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Buscar todas as aulas da turma no período
    let aulasQuery = supabase
      .from("aulas")
      .select("id, data_aula, conteudo_ministrado")
      .eq("turma_id", turma_id)
      .order("data_aula", { ascending: true });

    if (data_inicio) {
      aulasQuery = aulasQuery.gte("data_aula", data_inicio);
    }

    if (data_fim) {
      aulasQuery = aulasQuery.lte("data_aula", data_fim);
    }

    const { data: aulas, error: aulasError } = await aulasQuery;

    if (aulasError) {
      console.error("Error fetching aulas:", aulasError);
      return NextResponse.json(
        { error: "Erro ao buscar aulas" },
        { status: 500 }
      );
    }

    if (!aulas || aulas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          turma,
          periodo: {
            data_inicio,
            data_fim,
          },
          total_aulas: 0,
          alunas: [],
          resumo: {
            total_alunas: 0,
            media_presenca_geral: 0,
          },
        },
        message: "Nenhuma aula encontrada no período especificado",
      });
    }

    // Buscar todas as alunas da turma
    const { data: alunasData, error: alunasError } = await supabase
      .from("turmas_alunas")
      .select(
        `
        aluna_id,
        inscricoes (
          id,
          nome_completo,
          email
        )
      `
      )
      .eq("turma_id", turma_id);

    if (alunasError) {
      console.error("Error fetching alunas:", alunasError);
      return NextResponse.json(
        { error: "Erro ao buscar alunas da turma" },
        { status: 500 }
      );
    }

    const alunas = alunasData || [];

    // Buscar frequência para todas as aulas e alunas
    const aulaIds = aulas.map((aula) => aula.id);

    const { data: frequenciaData, error: frequenciaError } = await supabase
      .from("frequencia")
      .select("aula_id, aluna_id, presente, observacoes")
      .in("aula_id", aulaIds);

    if (frequenciaError) {
      console.error("Error fetching frequencia:", frequenciaError);
      return NextResponse.json(
        { error: "Erro ao buscar dados de frequência" },
        { status: 500 }
      );
    }

    // Organizar dados de frequência por aluna
    const frequenciaPorAluna = new Map();

    alunas.forEach((aluna) => {
      frequenciaPorAluna.set(aluna.aluna_id, {
        aluna: aluna.inscricoes,
        frequencia: new Map(),
        total_aulas: aulas.length,
        presencas: 0,
        faltas: 0,
        percentual_presenca: 0,
      });
    });

    // Processar dados de frequência
    frequenciaData?.forEach((freq) => {
      const alunaData = frequenciaPorAluna.get(freq.aluna_id);
      if (alunaData) {
        alunaData.frequencia.set(freq.aula_id, {
          presente: freq.presente,
          observacoes: freq.observacoes,
        });

        if (freq.presente) {
          alunaData.presencas++;
        } else {
          alunaData.faltas++;
        }
      }
    });

    // Calcular percentuais e converter para array
    const relatorioAlunas = Array.from(frequenciaPorAluna.values()).map(
      (alunaData) => {
        alunaData.percentual_presenca =
          alunaData.total_aulas > 0
            ? Math.round((alunaData.presencas / alunaData.total_aulas) * 100)
            : 0;

        // Converter Map de frequência para objeto organizado por data
        const frequenciaPorData: {
          [data_aula: string]: {
            aula_id: string;
            presente: boolean;
            observacoes: string | null;
          };
        } = {};
        aulas.forEach((aula) => {
          const freq = alunaData.frequencia.get(aula.id);
          frequenciaPorData[aula.data_aula] = {
            aula_id: aula.id,
            presente: freq?.presente || false,
            observacoes: freq?.observacoes || null,
          };
        });

        return {
          aluna: alunaData.aluna,
          total_aulas: alunaData.total_aulas,
          presencas: alunaData.presencas,
          faltas: alunaData.faltas,
          percentual_presenca: alunaData.percentual_presenca,
          frequencia_por_data: frequenciaPorData,
        };
      }
    );

    // Calcular resumo geral
    const totalAlunas = relatorioAlunas.length;
    const mediaPresencaGeral =
      totalAlunas > 0
        ? Math.round(
            relatorioAlunas.reduce(
              (acc, aluna) => acc + aluna.percentual_presenca,
              0
            ) / totalAlunas
          )
        : 0;

    // Organizar aulas para o relatório
    const aulasDetalhadas = aulas.map((aula) => {
      const presencasPorAula =
        frequenciaData?.filter((f) => f.aula_id === aula.id && f.presente) ||
        [];
      const totalAlunas =
        frequenciaData?.filter((f) => f.aula_id === aula.id) || [];

      return {
        ...aula,
        total_presencas: presencasPorAula.length,
        total_registros: totalAlunas.length,
        percentual_presenca_aula:
          totalAlunas.length > 0
            ? Math.round((presencasPorAula.length / totalAlunas.length) * 100)
            : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        turma,
        periodo: {
          data_inicio,
          data_fim,
        },
        aulas: aulasDetalhadas,
        total_aulas: aulas.length,
        alunas: relatorioAlunas,
        resumo: {
          total_alunas: totalAlunas,
          media_presenca_geral: mediaPresencaGeral,
          total_aulas_periodo: aulas.length,
        },
      },
    });
  } catch (error) {
    console.error("Error generating frequencia report:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

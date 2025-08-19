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
    // Verificar autenticação (apenas ADM pode buscar monitores candidatos)
    const authResult = await requireAuth(request, "ADM");
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

    // Buscar turma para verificar se existe
    const { data: turma, error: turmaError } = await supabase
      .from("turmas")
      .select("id")
      .eq("id", turma_id)
      .single();

    if (turmaError || !turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Buscar monitores que já estão vinculados à turma
    const { data: monitoresVinculados, error: vinculadosError } = await supabase
      .from("turmas_monitores")
      .select("monitor_id")
      .eq("turma_id", turma_id);

    if (vinculadosError) {
      console.error("Erro ao buscar monitores vinculados:", vinculadosError);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }

    const idsVinculados = monitoresVinculados?.map((tm) => tm.monitor_id) || [];

    // Buscar monitores candidatos (que não estão vinculados a esta turma)
    let query = supabase
      .from("monitores")
      .select("id, nome, email, role, created_at");

    if (idsVinculados.length > 0) {
      query = query.not("id", "in", `(${idsVinculados.join(",")})`);
    }

    const { data: monitoresCandidatos, error: candidatosError } = await query;

    if (candidatosError) {
      console.error("Erro ao buscar monitores candidatos:", candidatosError);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }

    // Buscar detalhes dos monitores já vinculados
    let monitoresVinculadosDetalhes: { id: any; nome: any; email: any; role: any; created_at: any; }[] = [];
    if (idsVinculados.length > 0) {
      const { data: vinculadosDetalhes, error: detalhesError } = await supabase
        .from("monitores")
        .select("id, nome, email, role, created_at")
        .in("id", idsVinculados);

      if (detalhesError) {
        console.error(
          "Erro ao buscar detalhes dos monitores vinculados:",
          detalhesError
        );
        return NextResponse.json(
          { error: "Erro interno do servidor" },
          { status: 500 }
        );
      }

      monitoresVinculadosDetalhes = vinculadosDetalhes || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        monitores_candidatos: monitoresCandidatos || [],
        monitores_vinculados: monitoresVinculadosDetalhes || [],
      },
    });
  } catch (error) {
    console.error("Erro na rota de monitores candidatos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

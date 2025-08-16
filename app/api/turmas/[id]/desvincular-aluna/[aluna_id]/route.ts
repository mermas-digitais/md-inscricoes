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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; aluna_id: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id: turma_id, aluna_id } = params;

    // Validar UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(aluna_id)) {
      return NextResponse.json(
        { error: "ID da aluna inválido" },
        { status: 400 }
      );
    }

    // Verificar se o vínculo existe
    const { data: vinculo, error: vinculoError } = await supabase
      .from("turmas_alunas")
      .select(
        `
        *,
        turmas (codigo_turma),
        inscricoes (nome)
      `
      )
      .eq("turma_id", turma_id)
      .eq("aluna_id", aluna_id)
      .single();

    if (vinculoError || !vinculo) {
      return NextResponse.json(
        {
          error:
            "Vínculo não encontrado. A aluna não está vinculada a esta turma.",
        },
        { status: 404 }
      );
    }

    // Remover o vínculo
    const { error: deleteError } = await supabase
      .from("turmas_alunas")
      .delete()
      .eq("turma_id", turma_id)
      .eq("aluna_id", aluna_id);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return NextResponse.json(
        { error: "Erro ao desvincular aluna da turma" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Aluna ${vinculo.inscricoes.nome} desvinculada com sucesso da turma ${vinculo.turmas.codigo_turma}`,
    });
  } catch (error) {
    console.error("Error desvinculando aluna:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

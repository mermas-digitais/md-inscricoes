import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para verificar autenticação ADM (apenas ADM pode gerenciar monitores)
async function verifyAdmAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { error: "Token de autorização não fornecido", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.ADMIN_ACCESS_TOKEN) {
    return {
      error: "Acesso negado. Apenas administradores podem gerenciar monitores.",
      status: 403,
    };
  }

  return { success: true };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; monitor_id: string } }
) {
  try {
    // Verificar autenticação ADM
    const authResult = await verifyAdmAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id: turma_id, monitor_id } = params;

    // Validar UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(monitor_id)) {
      return NextResponse.json(
        { error: "ID do monitor inválido" },
        { status: 400 }
      );
    }

    // Verificar se o vínculo existe
    const { data: vinculo, error: vinculoError } = await supabase
      .from("turmas_monitores")
      .select(
        `
        *,
        turmas (nome_turma),
        monitores (nome)
      `
      )
      .eq("turma_id", turma_id)
      .eq("monitor_id", monitor_id)
      .single();

    if (vinculoError || !vinculo) {
      return NextResponse.json(
        {
          error:
            "Vínculo não encontrado. O monitor não está vinculado a esta turma.",
        },
        { status: 404 }
      );
    }

    // Remover o vínculo
    const { error: deleteError } = await supabase
      .from("turmas_monitores")
      .delete()
      .eq("turma_id", turma_id)
      .eq("monitor_id", monitor_id);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return NextResponse.json(
        { error: "Erro ao desvincular monitor da turma" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Monitor ${vinculo.monitores.nome} desvinculado com sucesso da turma ${vinculo.turmas.nome_turma}`,
    });
  } catch (error) {
    console.error("Error desvinculando monitor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

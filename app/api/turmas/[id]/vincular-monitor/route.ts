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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: turma_id } = params;
    const { monitor_id } = await request.json();

    // Validar UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    if (!monitor_id || !uuidRegex.test(monitor_id)) {
      return NextResponse.json(
        { error: "ID do monitor é obrigatório e deve ser válido" },
        { status: 400 }
      );
    }

    // Verificar se a turma existe
    const { data: turma, error: turmaError } = await supabase
      .from("turmas")
      .select("id, nome_turma")
      .eq("id", turma_id)
      .single();

    if (turmaError || !turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o monitor existe
    const { data: monitor, error: monitorError } = await supabase
      .from("monitores")
      .select("id, nome, funcao")
      .eq("id", monitor_id)
      .single();

    if (monitorError || !monitor) {
      return NextResponse.json(
        { error: "Monitor não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o monitor já está vinculado à turma
    const { data: existingVinculo, error: vinculoError } = await supabase
      .from("turmas_monitores")
      .select("turma_id, monitor_id")
      .eq("turma_id", turma_id)
      .eq("monitor_id", monitor_id)
      .single();

    if (existingVinculo) {
      return NextResponse.json(
        { error: "Monitor já está vinculado a esta turma" },
        { status: 409 }
      );
    }

    // Criar o vínculo
    const { data: vinculo, error: insertError } = await supabase
      .from("turmas_monitores")
      .insert({
        turma_id,
        monitor_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Erro ao vincular monitor à turma" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        vinculo,
        turma: turma,
        monitor: monitor,
      },
      message: `Monitor ${monitor.nome} vinculado com sucesso à turma ${turma.nome_turma}`,
    });
  } catch (error) {
    console.error("Error vinculando monitor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

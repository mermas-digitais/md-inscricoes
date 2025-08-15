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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: turma_id } = params;
    const { aluna_id } = await request.json();

    // Validar UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(turma_id)) {
      return NextResponse.json(
        { error: "ID da turma inválido" },
        { status: 400 }
      );
    }

    if (!aluna_id || !uuidRegex.test(aluna_id)) {
      return NextResponse.json(
        { error: "ID da aluna é obrigatório e deve ser válido" },
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

    // Verificar se a aluna (inscrição) existe
    const { data: aluna, error: alunaError } = await supabase
      .from("inscricoes")
      .select("id, nome, status")
      .eq("id", aluna_id)
      .single();

    if (alunaError || !aluna) {
      return NextResponse.json(
        { error: "Aluna não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a aluna já está vinculada à turma
    const { data: existingVinculo, error: vinculoError } = await supabase
      .from("turmas_alunas")
      .select("turma_id, aluna_id")
      .eq("turma_id", turma_id)
      .eq("aluna_id", aluna_id)
      .single();

    if (existingVinculo) {
      return NextResponse.json(
        { error: "Aluna já está vinculada a esta turma" },
        { status: 409 }
      );
    }

    // Criar o vínculo
    const { data: vinculo, error: insertError } = await supabase
      .from("turmas_alunas")
      .insert({
        turma_id,
        aluna_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json(
        { error: "Erro ao vincular aluna à turma" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        vinculo,
        turma: turma,
        aluna: aluna,
      },
      message: `Aluna ${aluna.nome} vinculada com sucesso à turma ${turma.nome_turma}`,
    });
  } catch (error) {
    console.error("Error vinculando aluna:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

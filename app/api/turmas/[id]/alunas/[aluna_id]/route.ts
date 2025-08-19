import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; aluna_id: string } }
) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode vincular alunas)
    const authResult = await requireAuth(request, "MONITOR");
    if (authResult.response) return authResult.response;

    const { id: turma_id, aluna_id } = await params;

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
      message: `Aluna ${aluna.nome} vinculada com sucesso à turma ${turma.codigo_turma}`,
    });
  } catch (error) {
    console.error("Error vinculando aluna:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; aluna_id: string } }
) {
  try {
    // Verificar autenticação (MONITOR ou ADM pode desvincular alunas)
    const authResult = await requireAuth(request, "MONITOR");
    if (authResult.response) return authResult.response;

    const { id: turma_id, aluna_id } = await params;

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

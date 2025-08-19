import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; monitor_id: string } }
) {
  try {
    // Verificar autenticação (apenas ADM pode gerenciar monitores)
    const { response: authError } = await requireAuth(request, "ADM");
    if (authError) return authError;

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

    // Verificar se o monitor existe
    const { data: monitor, error: monitorError } = await supabase
      .from("monitores")
      .select("id, nome, email")
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
      message: `Monitor ${monitor.nome} vinculado com sucesso à turma ${turma.codigo_turma}`,
    });
  } catch (error) {
    console.error("Error vinculando monitor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; monitor_id: string } }
) {
  try {
    // Verificar autenticação (apenas ADM pode gerenciar monitores)
    const { response: authError } = await requireAuth(request, "ADM");
    if (authError) return authError;

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
        turmas (codigo_turma),
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
      message: `Monitor ${vinculo.monitores.nome} desvinculado com sucesso da turma ${vinculo.turmas.codigo_turma}`,
    });
  } catch (error) {
    console.error("Error desvinculando monitor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

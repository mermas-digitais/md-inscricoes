import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(request: NextRequest) {
  try {
    const { monitorId } = await request.json();

    if (!monitorId) {
      return NextResponse.json(
        { error: "Monitor ID é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o monitor existe antes de excluir
    const { data: monitorData, error: fetchError } = await supabase
      .from("monitores")
      .select("id, nome, email")
      .eq("id", monitorId)
      .single();

    if (fetchError || !monitorData) {
      return NextResponse.json(
        { error: "Monitor não encontrado" },
        { status: 404 }
      );
    }

    // Excluir o monitor
    const { error: deleteError } = await supabase
      .from("monitores")
      .delete()
      .eq("id", monitorId);

    if (deleteError) {
      console.error("Erro ao excluir monitor:", deleteError);
      return NextResponse.json(
        { error: "Erro ao excluir monitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Monitor "${monitorData.nome}" foi excluído com sucesso`,
      deletedMonitor: monitorData,
    });
  } catch (error) {
    console.error("Erro na requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

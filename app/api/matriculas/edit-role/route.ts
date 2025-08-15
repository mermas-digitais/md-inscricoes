import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(request: NextRequest) {
  try {
    console.log("=== API Edit Role - Início ===");

    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseKey) {
      console.error("Variáveis de ambiente não configuradas:");
      console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
      console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
      return NextResponse.json(
        { error: "Configuração do servidor incorreta" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Body recebido:", body);

    const { monitorId, role } = body;

    if (!monitorId || !role) {
      console.error("Parâmetros obrigatórios faltando:", { monitorId, role });
      return NextResponse.json(
        { error: "Monitor ID e role são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar role
    if (!["ADM", "MONITOR"].includes(role)) {
      console.error("Role inválida:", role);
      return NextResponse.json(
        { error: "Role inválida. Use ADM ou MONITOR" },
        { status: 400 }
      );
    }

    console.log("Tentando atualizar monitor:", { monitorId, role });

    // Atualizar a role do monitor
    const { data, error } = await supabase
      .from("monitores")
      .update({ role })
      .eq("id", monitorId)
      .select();

    console.log("Resultado da query:", { data, error });

    if (error) {
      console.error("Erro do Supabase ao atualizar role:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar role do monitor", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error("Monitor não encontrado ou não atualizado:", monitorId);
      return NextResponse.json(
        { error: "Monitor não encontrado" },
        { status: 404 }
      );
    }

    console.log("Role atualizada com sucesso:", data[0]);
    return NextResponse.json({
      success: true,
      message: `Role alterada para ${role} com sucesso`,
      monitor: data[0],
    });
  } catch (error) {
    console.error("Erro na requisição:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

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

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { atualizacoes } = await request.json();

    // Validar se as atualizações foram fornecidas
    if (
      !atualizacoes ||
      !Array.isArray(atualizacoes) ||
      atualizacoes.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Lista de atualizações é obrigatória e deve conter pelo menos um item",
        },
        { status: 400 }
      );
    }

    // Validar cada atualização
    for (let i = 0; i < atualizacoes.length; i++) {
      const item = atualizacoes[i];

      if (!item.frequencia_id) {
        return NextResponse.json(
          { error: `Item ${i + 1}: ID da frequência é obrigatório` },
          { status: 400 }
        );
      }

      // Validar UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(item.frequencia_id)) {
        return NextResponse.json(
          { error: `Item ${i + 1}: ID da frequência inválido` },
          { status: 400 }
        );
      }

      if (typeof item.presente !== "boolean") {
        return NextResponse.json(
          { error: `Item ${i + 1}: Campo 'presente' deve ser true ou false` },
          { status: 400 }
        );
      }
    }

    const resultados = [];
    const erros = [];

    // Processar cada atualização
    for (let i = 0; i < atualizacoes.length; i++) {
      const { frequencia_id, presente, observacoes } = atualizacoes[i];

      try {
        // Verificar se o registro existe
        const { data: existingRecord, error: existingError } = await supabase
          .from("frequencia")
          .select("id, aula_id, aluna_id")
          .eq("id", frequencia_id)
          .single();

        if (existingError || !existingRecord) {
          erros.push({
            frequencia_id,
            erro: "Registro de frequência não encontrado",
          });
          continue;
        }

        // Atualizar registro
        const updateData: any = { presente };

        if (observacoes !== undefined) {
          updateData.observacoes = observacoes?.trim() || null;
        }

        const { data: updatedRecord, error: updateError } = await supabase
          .from("frequencia")
          .update(updateData)
          .eq("id", frequencia_id)
          .select(
            `
            *,
            aulas (
              id,
              data_aula,
              turmas (
                id,
                nome_turma
              )
            ),
            inscricoes (
              id,
              nome_completo,
              email
            )
          `
          )
          .single();

        if (updateError) {
          console.error(
            `Error updating frequencia ${frequencia_id}:`,
            updateError
          );
          erros.push({
            frequencia_id,
            erro: "Erro ao atualizar registro",
          });
          continue;
        }

        resultados.push(updatedRecord);
      } catch (error) {
        console.error(`Error processing frequencia ${frequencia_id}:`, error);
        erros.push({
          frequencia_id,
          erro: "Erro interno ao processar registro",
        });
      }
    }

    // Retornar resultado
    const response: any = {
      success: true,
      atualizados: resultados.length,
      total_solicitados: atualizacoes.length,
      data: resultados,
    };

    if (erros.length > 0) {
      response.erros = erros;
      response.message = `${resultados.length} registros atualizados com sucesso, ${erros.length} falharam`;
    } else {
      response.message = `Todos os ${resultados.length} registros foram atualizados com sucesso`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating frequencia:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

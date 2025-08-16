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

export async function GET(
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

    const { id } = params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID da aula inválido" },
        { status: 400 }
      );
    }

    // Buscar aula com dados da turma e frequência
    const { data: aula, error } = await supabase
      .from("aulas")
      .select(
        `
        *,
        turmas (
          id,
          codigo_turma,
          cursos (
            id,
            nome_curso
          )
        ),
        frequencia (
          id,
          aluna_id,
          presente,
          observacoes,
          inscricoes (
            id,
            nome_completo,
            email
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Aula não encontrada" },
          { status: 404 }
        );
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar aula" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aula,
    });
  } catch (error) {
    console.error("Error fetching aula:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = params;
    const { data_aula, conteudo_ministrado } = await request.json();

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID da aula inválido" },
        { status: 400 }
      );
    }

    // Verificar se a aula existe
    const { data: existingAula, error: existingError } = await supabase
      .from("aulas")
      .select("id, turma_id, data_aula")
      .eq("id", id)
      .single();

    if (existingError || !existingAula) {
      return NextResponse.json(
        { error: "Aula não encontrada" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data_aula !== undefined) {
      if (!data_aula) {
        return NextResponse.json(
          { error: "Data da aula é obrigatória" },
          { status: 400 }
        );
      }

      // Validar formato da data (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data_aula)) {
        return NextResponse.json(
          { error: "Data da aula deve estar no formato YYYY-MM-DD" },
          { status: 400 }
        );
      }

      // Se a data está sendo alterada, verificar se não existe conflito
      if (data_aula !== existingAula.data_aula) {
        const { data: conflictAula, error: conflictError } = await supabase
          .from("aulas")
          .select("id")
          .eq("turma_id", existingAula.turma_id)
          .eq("data_aula", data_aula)
          .neq("id", id)
          .single();

        if (conflictAula) {
          return NextResponse.json(
            {
              error: "Já existe uma aula registrada nesta data para esta turma",
            },
            { status: 409 }
          );
        }
      }

      updateData.data_aula = data_aula;
    }

    if (conteudo_ministrado !== undefined) {
      updateData.conteudo_ministrado = conteudo_ministrado?.trim() || null;
    }

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado fornecido para atualização" },
        { status: 400 }
      );
    }

    // Atualizar aula
    const { data: updatedAula, error: updateError } = await supabase
      .from("aulas")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        turmas (
          id,
          codigo_turma,
          cursos (
            id,
            nome_curso
          )
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar aula" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedAula,
      message: "Aula atualizada com sucesso",
    });
  } catch (error) {
    console.error("Error updating aula:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação ADM apenas
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorização não fornecido" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    if (token !== process.env.ADMIN_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem excluir aulas." },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "ID da aula inválido" },
        { status: 400 }
      );
    }

    // Verificar se a aula existe
    const { data: existingAula, error: existingError } = await supabase
      .from("aulas")
      .select("id, data_aula, turmas(codigo_turma)")
      .eq("id", id)
      .single();

    if (existingError || !existingAula) {
      return NextResponse.json(
        { error: "Aula não encontrada" },
        { status: 404 }
      );
    }

    // Excluir aula (os registros de frequência serão excluídos automaticamente devido ao CASCADE)
    const { error: deleteError } = await supabase
      .from("aulas")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return NextResponse.json(
        { error: "Erro ao excluir aula" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Aula excluída com sucesso",
    });
  } catch (error) {
    console.error("Error deleting aula:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

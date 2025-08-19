import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: inscricao, error } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !inscricao) {
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(inscricao);
  } catch (error) {
    console.error("Erro ao buscar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestData = await request.json();

    // Se apenas status está sendo enviado (alteração de status)
    if (Object.keys(requestData).length === 1 && requestData.status) {
      const { status } = requestData;

      // Validar status
      const validStatuses = [
        "INSCRITA",
        "MATRICULADA",
        "CANCELADA",
        "EXCEDENTE",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("inscricoes")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar status:", error);
        return NextResponse.json(
          { error: "Erro ao atualizar status" },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Inscrição não encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    // Se múltiplos campos estão sendo enviados (edição completa)
    const {
      nome,
      email,
      telefone_whatsapp,
      data_nascimento,
      cpf,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      nome_responsavel,
      escolaridade,
      ano_escolar,
      escola,
      curso,
    } = requestData;

    // Campos obrigatórios
    const requiredFields = {
      nome,
      email,
      telefone_whatsapp,
      data_nascimento,
      cpf,
      cep,
      logradouro,
      numero,
      bairro,
      cidade,
      estado,
      nome_responsavel,
      escolaridade,
      ano_escolar,
      escola,
      curso,
    };

    // Validar campos obrigatórios
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === "") {
        return NextResponse.json(
          { error: `Campo ${field} é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Validar formato do CPF (11 dígitos)
    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      return NextResponse.json(
        { error: "CPF deve ter 11 dígitos" },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone_whatsapp: telefone_whatsapp.trim(),
      data_nascimento,
      cpf: cpf.trim(), 
      cep: cep.trim(),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      complemento: complemento?.trim() || null,
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      nome_responsavel: nome_responsavel.trim(),
      escolaridade: escolaridade.trim(),
      ano_escolar: ano_escolar.trim(),
      escola: escola.trim(),
      curso: curso.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("inscricoes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar inscrição:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar dados da inscrição" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao atualizar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

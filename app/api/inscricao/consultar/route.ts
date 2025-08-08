import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Decodificar o CPF da URL (pode vir com %2E para pontos)
    const decodedCpf = decodeURIComponent(cpf);

    // Formatar CPF para comparação (XXX.XXX.XXX-XX) - igual ao que está no banco
    const formatCPF = (cpf: string) => {
      const numbers = cpf.replace(/\D/g, "");
      if (numbers.length !== 11) {
        return null;
      }
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };

    const formattedCPF = formatCPF(decodedCpf);
    if (!formattedCPF) {
      return NextResponse.json(
        { error: "CPF deve ter 11 dígitos" },
        { status: 400 }
      );
    }

    // Search for inscription by CPF
    const { data: inscricao, error } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("cpf", formattedCPF)
      .single();

    if (error) {
      console.error("Database error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Inscrição não encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao consultar inscrição" },
        { status: 500 }
      );
    }

    // Transform data to match the expected structure
    const transformedInscricao = {
      id: inscricao.id,
      nome_completo: inscricao.nome, // Map nome to nome_completo
      email: inscricao.email,
      telefone: inscricao.telefone_whatsapp, // Map telefone_whatsapp to telefone
      data_nascimento: inscricao.data_nascimento,
      cpf: inscricao.cpf,
      endereco: `${inscricao.logradouro}, ${inscricao.numero}${
        inscricao.complemento ? ` - ${inscricao.complemento}` : ""
      }, ${inscricao.bairro}`,
      cidade: inscricao.cidade,
      estado: inscricao.estado,
      cep: inscricao.cep,
      curso_interesse: inscricao.curso, // Map curso to curso_interesse
      experiencia_nivel: inscricao.escolaridade, // Map escolaridade to experiencia_nivel
      motivacao: `Ano escolar: ${inscricao.ano_escolar}${
        inscricao.escola ? ` | Escola: ${inscricao.escola}` : ""
      }`, // Include escola info
      disponibilidade: "A definir", // Default value
      como_soube: "Não informado", // Default value
      created_at: inscricao.created_at,
      status: inscricao.status || "confirmada", // Default para confirmada se não existir
      // Dados do responsável
      nome_responsavel: inscricao.nome_responsavel,
      cpf_responsavel: inscricao.cpf_responsavel,
    };

    return NextResponse.json(transformedInscricao);
  } catch (error) {
    console.error("Error consulting inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

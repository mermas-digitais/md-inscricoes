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

    // 1) Buscar inscrição "tradicional" na tabela inscricoes
    const { data: inscricao, error: inscricaoError } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("cpf", formattedCPF)
      .single();

    // 2) Tentar encontrar como participante de evento (MDX25)
    const numericCPF = decodedCpf.replace(/\D/g, "");

    const { data: participante, error: participanteError } = await supabase
      .from("participantes_eventos")
      .select("*")
      .in("cpf", [formattedCPF, numericCPF])
      .limit(1)
      .single();

    let eventoParticipantePayload: any | null = null;
    if (!participanteError && participante) {
      // Buscar a inscrição do evento
      const { data: inscricaoEvento } = await supabase
        .from("inscricoes_eventos")
        .select("*")
        .eq("id", participante.inscricao_id)
        .single();

      // Buscar modalidade
      let modalidadeNome: string | null = null;
      if (inscricaoEvento?.modalidade_id) {
        const { data: modalidade } = await supabase
          .from("modalidades")
          .select("*")
          .eq("id", inscricaoEvento.modalidade_id)
          .single();
        modalidadeNome = modalidade?.nome || null;
      }

      // Buscar orientador
      let orientador: any = null;
      if (inscricaoEvento?.orientador_id) {
        const { data } = await supabase
          .from("orientadores")
          .select("*")
          .eq("id", inscricaoEvento.orientador_id)
          .single();
        orientador = data || null;
      }

      // Buscar todos os membros da equipe
      const { data: membros } = await supabase
        .from("participantes_eventos")
        .select("*")
        .eq("inscricao_id", participante.inscricao_id);

      eventoParticipantePayload = {
        kind: "evento_participante" as const,
        equipe: {
          id: inscricaoEvento?.id,
          nome_equipe: inscricaoEvento?.nome_equipe,
          modalidade: modalidadeNome,
          status: inscricaoEvento?.status,
        },
        orientador: orientador
          ? {
              nome: orientador.nome,
              escola: orientador.escola,
            }
          : null,
        membros: (membros || []).map((m: any) => ({
          id: m.id,
          nome: m.nome,
          genero: m.genero,
          ouvinte: !!m.ouvinte,
        })),
      };
    }

    // 3) Tentar encontrar como orientador (listar as equipes dele)
    const { data: orientadorByCPF, error: orientadorError } = await supabase
      .from("orientadores")
      .select("*")
      .in("cpf", [formattedCPF, numericCPF])
      .limit(1)
      .single();

    let orientadorPayload: any | null = null;
    if (!orientadorError && orientadorByCPF) {
      // Buscar as inscrições de eventos deste orientador
      const { data: inscricoesOrientador } = await supabase
        .from("inscricoes_eventos")
        .select("*")
        .eq("orientador_id", orientadorByCPF.id);

      // Para cada inscrição, buscar modalidade e membros
      const equipes: any[] = [];
      for (const insc of inscricoesOrientador || []) {
        let modalidadeNome: string | null = null;
        if (insc.modalidade_id) {
          const { data: modalidade } = await supabase
            .from("modalidades")
            .select("*")
            .eq("id", insc.modalidade_id)
            .single();
          modalidadeNome = modalidade?.nome || null;
        }

        const { data: membros } = await supabase
          .from("participantes_eventos")
          .select("*")
          .eq("inscricao_id", insc.id);

        equipes.push({
          id: insc.id,
          nome_equipe: insc.nome_equipe,
          modalidade: modalidadeNome,
          status: insc.status,
          membros: (membros || []).map((m: any) => ({
            id: m.id,
            nome: m.nome,
            cpf: m.cpf,
            data_nascimento: m.data_nascimento,
            genero: m.genero,
          })),
        });
      }

      // Remover dados sensíveis do orientador e dos membros
      const equipesSanitizadas = (inscricoesOrientador || []).map(
        (insc: any) => ({
          id: insc.id,
          nome_equipe: insc.nome_equipe,
          modalidade: null as string | null,
          status: insc.status,
          membros: [] as any[],
        })
      );

      // Popular modalidade e membros sem dados sensíveis
      for (let i = 0; i < equipesSanitizadas.length; i++) {
        const insc = (inscricoesOrientador || [])[i];
        if (insc?.modalidade_id) {
          const { data: modalidade } = await supabase
            .from("modalidades")
            .select("*")
            .eq("id", insc.modalidade_id)
            .single();
          equipesSanitizadas[i].modalidade = modalidade?.nome || null;
        }
        const { data: membros } = await supabase
          .from("participantes_eventos")
          .select("*")
          .eq("inscricao_id", insc.id);
        equipesSanitizadas[i].membros = (membros || []).map((m: any) => ({
          id: m.id,
          nome: m.nome,
          genero: m.genero,
          ouvinte: !!m.ouvinte,
        }));
      }

      orientadorPayload = {
        kind: "orientador" as const,
        orientador: {
          id: orientadorByCPF.id,
          nome: orientadorByCPF.nome,
          escola: orientadorByCPF.escola,
        },
        equipes: equipesSanitizadas,
      };
    }

    // Montar resposta consolidada (pode conter múltiplos resultados)
    const results: any[] = [];

    if (!inscricaoError && inscricao) {
      results.push({
        kind: "inscricao" as const,
        id: inscricao.id,
        nome_completo: inscricao.nome,
        curso_interesse: inscricao.curso,
        created_at: inscricao.created_at,
        status: inscricao.status || "confirmada",
      });
    }
    if (eventoParticipantePayload) {
      results.push(eventoParticipantePayload);
    }
    if (orientadorPayload) {
      // Garantir preferência ao orientador: colocar no início
      results.unshift(orientadorPayload);
    }

    if (results.length === 0) {
      // Se nada encontrado
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    // Compatibilidade: se só 1 resultado, retornar plano; se mais, retornar multi
    if (results.length === 1) {
      return NextResponse.json(results[0]);
    }

    return NextResponse.json({ kind: "multi", results });
  } catch (error) {
    console.error("Error consulting inscription:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

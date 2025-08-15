import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { response: authError } = await requireAuth(request, "MONITOR");
    if (authError) return authError;

    // Buscar estatísticas dos cursos
    const { data: cursos, error: cursosError } = await supabase
      .from("cursos")
      .select("*");

    if (cursosError) {
      console.error("Database error:", cursosError);
      return NextResponse.json(
        { error: "Erro ao buscar dados dos cursos" },
        { status: 500 }
      );
    }

    // Buscar estatísticas das turmas
    const { data: turmas, error: turmasError } = await supabase
      .from("turmas")
      .select("*, cursos(*)");

    if (turmasError) {
      console.error("Database error:", turmasError);
      return NextResponse.json(
        { error: "Erro ao buscar dados das turmas" },
        { status: 500 }
      );
    }

    // Buscar total de alunas matriculadas
    const { data: totalAlunas, error: alunasError } = await supabase
      .from("turmas_alunas")
      .select("*, turmas(*, cursos(*))");

    if (alunasError) {
      console.error("Database error:", alunasError);
      return NextResponse.json(
        { error: "Erro ao buscar dados das alunas" },
        { status: 500 }
      );
    }

    // Buscar total de aulas
    const { data: aulas, error: aulasError } = await supabase
      .from("aulas")
      .select("*, turmas(*, cursos(*))");

    if (aulasError) {
      console.error("Database error:", aulasError);
      return NextResponse.json(
        { error: "Erro ao buscar dados das aulas" },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const stats = {
      // Estatísticas gerais
      total_cursos: cursos.length,
      cursos_ativos: cursos.filter(c => c.status === "ativo").length,
      cursos_inativos: cursos.filter(c => c.status === "inativo").length,
      
      // Por projeto
      cursos_meninas_stem: cursos.filter(c => c.projeto === "Meninas STEM").length,
      cursos_mermas_digitais: cursos.filter(c => c.projeto === "Mermãs Digitais").length,
      
      // Turmas
      total_turmas: turmas.length,
      turmas_ativas: turmas.filter(t => t.status === "Ativa").length,
      turmas_planejamento: turmas.filter(t => t.status === "Planejamento").length,
      turmas_concluidas: turmas.filter(t => t.status === "Concluída").length,
      
      // Alunas
      total_alunas: totalAlunas.length,
      alunas_cursos_ativos: totalAlunas.filter(a => a.turmas?.cursos?.status === "ativo").length,
      alunas_meninas_stem: totalAlunas.filter(a => a.turmas?.cursos?.projeto === "Meninas STEM").length,
      alunas_mermas_digitais: totalAlunas.filter(a => a.turmas?.cursos?.projeto === "Mermãs Digitais").length,
      
      // Aulas
      total_aulas: aulas.length,
      aulas_cursos_ativos: aulas.filter(a => a.turmas?.cursos?.status === "ativo").length,
      
      // Detalhes por projeto
      projetos: {
        "Meninas STEM": {
          cursos: cursos.filter(c => c.projeto === "Meninas STEM"),
          cursos_ativos: cursos.filter(c => c.projeto === "Meninas STEM" && c.status === "ativo").length,
          turmas: turmas.filter(t => t.cursos?.projeto === "Meninas STEM").length,
          alunas: totalAlunas.filter(a => a.turmas?.cursos?.projeto === "Meninas STEM").length,
          aulas: aulas.filter(a => a.turmas?.cursos?.projeto === "Meninas STEM").length,
        },
        "Mermãs Digitais": {
          cursos: cursos.filter(c => c.projeto === "Mermãs Digitais"),
          cursos_ativos: cursos.filter(c => c.projeto === "Mermãs Digitais" && c.status === "ativo").length,
          turmas: turmas.filter(t => t.cursos?.projeto === "Mermãs Digitais").length,
          alunas: totalAlunas.filter(a => a.turmas?.cursos?.projeto === "Mermãs Digitais").length,
          aulas: aulas.filter(a => a.turmas?.cursos?.projeto === "Mermãs Digitais").length,
        }
      },
      
      // Detalhes por status
      status: {
        ativo: {
          cursos: cursos.filter(c => c.status === "ativo"),
          turmas: turmas.filter(t => t.cursos?.status === "ativo").length,
          alunas: totalAlunas.filter(a => a.turmas?.cursos?.status === "ativo").length,
          aulas: aulas.filter(a => a.turmas?.cursos?.status === "ativo").length,
        },
        inativo: {
          cursos: cursos.filter(c => c.status === "inativo"),
          turmas: turmas.filter(t => t.cursos?.status === "inativo").length,
          alunas: totalAlunas.filter(a => a.turmas?.cursos?.status === "inativo").length,
          aulas: aulas.filter(a => a.turmas?.cursos?.status === "inativo").length,
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching ensino stats:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

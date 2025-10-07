import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../../../../lib/generated/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const prisma = new PrismaClient();

// Todas as tabelas existem em ambos os bancos agora
const COMMON_TABLES = [
  "escolas",
  "inscricoes",
  "verification_codes",
  "monitores",
  "turmas",
  "frequencia",
  "turmas_alunas",
  "cursos",
  "aulas",
  "materiais_aula",
  "modulos",
  "turmas_monitores",
  "eventos",
  "modalidades",
  "orientadores",
  "inscricoes_eventos",
  "participantes_eventos",
];

// Todas as tabelas
const ALL_TABLES = [...COMMON_TABLES];

interface TableStatus {
  table: string;
  localCount: number;
  supabaseCount: number;
  difference: number;
  status:
    | "synced"
    | "local_ahead"
    | "supabase_ahead"
    | "error"
    | "local_only"
    | "supabase_only";
  error?: string;
  type: "common" | "local_only" | "supabase_only";
}

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Verificando status de sincronização dos bancos");

    const tableStatuses: TableStatus[] = [];
    let totalLocalRecords = 0;
    let totalSupabaseRecords = 0;
    let syncedTables = 0;
    let errorTables = 0;

    for (const tableName of ALL_TABLES) {
      try {
        const [localCount, supabaseCount] = await Promise.all([
          getLocalTableCount(tableName),
          getSupabaseTableCount(tableName),
        ]);

        const difference = localCount - supabaseCount;
        let status: TableStatus["status"] = "synced";
        let type: TableStatus["type"] = "common";

        // Todas as tabelas são comuns agora
        type = "common";

        if (localCount === 0 && supabaseCount > 0) {
          status = "supabase_ahead";
        } else if (localCount > 0 && supabaseCount === 0) {
          status = "local_ahead";
        } else {
          // Tabela comum - verificar diferenças
          if (difference > 0) {
            status = "local_ahead";
          } else if (difference < 0) {
            status = "supabase_ahead";
          }
        }

        if (status === "synced") {
          syncedTables++;
        }

        tableStatuses.push({
          table: tableName,
          localCount,
          supabaseCount,
          difference,
          status,
          type,
        });

        totalLocalRecords += localCount;
        totalSupabaseRecords += supabaseCount;

        console.log(
          `📋 ${tableName}: Local=${localCount}, Supabase=${supabaseCount}, Status=${status}, Type=${type}`
        );
      } catch (error) {
        errorTables++;
        tableStatuses.push({
          table: tableName,
          localCount: 0,
          supabaseCount: 0,
          difference: 0,
          status: "error",
          type: "common",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
        console.error(`❌ Erro na tabela ${tableName}:`, error);
      }
    }

    const overallStatus = getOverallStatus(tableStatuses);
    const totalDifference = totalLocalRecords - totalSupabaseRecords;

    console.log(
      `🎯 Status geral: ${overallStatus}, Diferença total: ${totalDifference}`
    );

    return NextResponse.json({
      success: true,
      overallStatus,
      summary: {
        totalTables: ALL_TABLES.length,
        commonTables: COMMON_TABLES.length,
        localOnlyTables: 0, // Todas as tabelas são comuns agora
        syncedTables,
        errorTables,
        totalLocalRecords,
        totalSupabaseRecords,
        totalDifference,
      },
      tables: tableStatuses,
      recommendations: getRecommendations(tableStatuses),
    });
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function getLocalTableCount(tableName: string): Promise<number> {
  try {
    // Mapear nomes de tabelas para nomes de modelos do Prisma
    const modelMap: { [key: string]: string } = {
      escolas: "escolas",
      inscricoes: "inscricoes",
      verification_codes: "verificationCodes",
      monitores: "monitores",
      turmas: "turmas",
      frequencia: "frequencia",
      turmas_alunas: "turmasAlunas",
      cursos: "cursos",
      aulas: "aulas",
      materiais_aula: "materiaisAula",
      modulos: "modulos",
      turmas_monitores: "turmasMonitores",
      eventos: "eventos",
      modalidades: "modalidades",
      orientadores: "orientadores",
      inscricoes_eventos: "inscricoesEventos",
      participantes_eventos: "participantesEventos",
    };

    const modelName = modelMap[tableName] || tableName;
    const result = await (prisma as any)[modelName].count();
    return result;
  } catch (error) {
    console.error(
      `Erro ao contar registros locais da tabela ${tableName}:`,
      error
    );
    return 0;
  }
}

async function getSupabaseTableCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(
        `Erro ao contar registros do Supabase da tabela ${tableName}:`,
        error
      );
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error(
      `Erro ao contar registros do Supabase da tabela ${tableName}:`,
      error
    );
    return 0;
  }
}

function getOverallStatus(
  tableStatuses: TableStatus[]
): "synced" | "out_of_sync" | "error" {
  const errorTables = tableStatuses.filter((t) => t.status === "error");
  const outOfSyncTables = tableStatuses.filter(
    (t) => t.status !== "synced" && t.status !== "error" && t.type === "common"
  );

  if (errorTables.length > 0) {
    return "error";
  }

  if (outOfSyncTables.length > 0) {
    return "out_of_sync";
  }

  return "synced";
}

function getRecommendations(tableStatuses: TableStatus[]): string[] {
  const recommendations: string[] = [];

  const localAheadTables = tableStatuses.filter(
    (t) => t.status === "local_ahead" && t.type === "common"
  );
  const supabaseAheadTables = tableStatuses.filter(
    (t) => t.status === "supabase_ahead" && t.type === "common"
  );
  const errorTables = tableStatuses.filter((t) => t.status === "error");
  const localOnlyTables = tableStatuses.filter((t) => t.type === "local_only");

  if (localAheadTables.length > 0) {
    recommendations.push(
      `Sincronizar ${localAheadTables.length} tabela(s) do banco local para o Supabase`
    );
  }

  if (supabaseAheadTables.length > 0) {
    recommendations.push(
      `Sincronizar ${supabaseAheadTables.length} tabela(s) do Supabase para o banco local`
    );
  }

  if (errorTables.length > 0) {
    recommendations.push(
      `Corrigir erros em ${errorTables.length} tabela(s) antes da sincronização`
    );
  }

  if (localOnlyTables.length > 0) {
    recommendations.push(
      `⚠️ ${localOnlyTables.length} tabela(s) existem apenas no banco local (sistema de eventos)`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Todos os bancos estão sincronizados!");
  }

  return recommendations;
}

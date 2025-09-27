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

interface SyncResult {
  table: string;
  synced: number;
  errors: number;
  total: number;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando sincronização do Supabase para o banco local");

    const results: SyncResult[] = [];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const tableName of COMMON_TABLES) {
      console.log(`📊 Sincronizando tabela: ${tableName}`);

      try {
        const result = await syncTableFromSupabase(tableName);
        results.push(result);
        totalSynced += result.synced;
        totalErrors += result.errors;

        console.log(
          `✅ ${tableName}: ${result.synced} registros sincronizados, ${result.errors} erros`
        );
      } catch (error) {
        const errorResult: SyncResult = {
          table: tableName,
          synced: 0,
          errors: 0,
          total: 0,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        };
        results.push(errorResult);
        totalErrors++;
        console.error(`❌ Erro na tabela ${tableName}:`, error);
      }
    }

    console.log(
      `🎉 Sincronização finalizada: ${totalSynced} registros sincronizados, ${totalErrors} erros`
    );

    return NextResponse.json({
      success: true,
      message: "Sincronização do Supabase para o banco local finalizada",
      results,
      summary: {
        totalSynced,
        totalErrors,
        tablesProcessed: COMMON_TABLES.length,
        successfulTables: results.filter((r) => r.success).length,
        failedTables: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
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

async function syncTableFromSupabase(tableName: string): Promise<SyncResult> {
  // Buscar dados do Supabase
  const { data: supabaseData, error } = await supabase
    .from(tableName)
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar dados do Supabase: ${error.message}`);
  }

  if (!supabaseData || supabaseData.length === 0) {
    return {
      table: tableName,
      synced: 0,
      errors: 0,
      total: 0,
      success: true,
    };
  }

  let syncedCount = 0;
  let errorCount = 0;

  for (const record of supabaseData) {
    try {
      // Preparar dados para o Prisma
      const prismaData = prepareDataForPrisma(record);

      // Usar upsert para inserir ou atualizar
      await (prisma as any)[tableName].upsert({
        where: { id: record.id },
        update: prismaData,
        create: prismaData,
      });

      syncedCount++;
    } catch (error) {
      console.error(
        `❌ Erro ao sincronizar registro ${record.id} da tabela ${tableName}:`,
        error
      );
      errorCount++;
    }
  }

  return {
    table: tableName,
    synced: syncedCount,
    errors: errorCount,
    total: supabaseData.length,
    success: true,
  };
}

function prepareDataForPrisma(data: any): any {
  // Converter datas ISO string para Date
  const prepared = { ...data };

  Object.keys(prepared).forEach((key) => {
    if (typeof prepared[key] === "string" && isDateString(prepared[key])) {
      // Se for apenas data (YYYY-MM-DD), adicionar horário para evitar problemas
      if (prepared[key].match(/^\d{4}-\d{2}-\d{2}$/)) {
        prepared[key] = new Date(prepared[key] + "T00:00:00.000Z");
      } else {
        prepared[key] = new Date(prepared[key]);
      }
    }
  });

  // Converter snake_case para camelCase para campos específicos do Prisma
  if (prepared.created_at) {
    prepared.createdAt = prepared.created_at;
    delete prepared.created_at;
  }
  if (prepared.updated_at) {
    prepared.updatedAt = prepared.updated_at;
    delete prepared.updated_at;
  }

  return prepared;
}

function isDateString(str: string): boolean {
  // Aceitar tanto formato ISO completo quanto apenas data
  // Incluir formato com timezone offset (+00:00)
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    str
  );
}

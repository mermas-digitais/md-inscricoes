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
  direction?: "to-supabase" | "from-supabase" | "bidirectional";
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando sincronização bidirecional inteligente");

    const results: SyncResult[] = [];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const tableName of COMMON_TABLES) {
      console.log(`📊 Analisando tabela: ${tableName}`);

      try {
        const result = await syncTableBidirectional(tableName);
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
      `🎉 Sincronização bidirecional finalizada: ${totalSynced} registros sincronizados, ${totalErrors} erros`
    );

    return NextResponse.json({
      success: true,
      message: "Sincronização bidirecional inteligente finalizada",
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
    console.error("❌ Erro na sincronização bidirecional:", error);
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

async function syncTableBidirectional(tableName: string): Promise<SyncResult> {
  // Buscar dados de ambos os bancos
  const [localData, supabaseData] = await Promise.all([
    (prisma as any)[tableName].findMany({ orderBy: { id: "asc" } }),
    supabase.from(tableName).select("*").order("id", { ascending: true }),
  ]);

  if (supabaseData.error) {
    throw new Error(
      `Erro ao buscar dados do Supabase: ${supabaseData.error.message}`
    );
  }

  const supabaseRecords = supabaseData.data || [];

  // Criar mapas para comparação rápida
  const localMap = new Map(localData.map((item: any) => [item.id, item]));
  const supabaseMap = new Map(
    supabaseRecords.map((item: any) => [item.id, item])
  );

  let syncedCount = 0;
  let errorCount = 0;

  // Sincronizar registros do Supabase para o Local
  for (const [id, supabaseRecord] of supabaseMap) {
    try {
      const localRecord = localMap.get(id);

      if (!localRecord) {
        // Registro existe apenas no Supabase - inserir no local
        const prismaData = prepareDataForPrisma(supabaseRecord);
        await (prisma as any)[tableName].create({ data: prismaData });
        syncedCount++;
      } else {
        // Registro existe em ambos - verificar se precisa atualizar
        const needsUpdate = needsUpdateRecord(localRecord, supabaseRecord);
        if (needsUpdate) {
          const prismaData = prepareDataForPrisma(supabaseRecord);
          await (prisma as any)[tableName].update({
            where: { id },
            data: prismaData,
          });
          syncedCount++;
        }
      }
    } catch (error) {
      console.error(
        `❌ Erro ao sincronizar registro ${id} do Supabase para Local:`,
        error
      );
      errorCount++;
    }
  }

  // Sincronizar registros do Local para o Supabase
  for (const [id, localRecord] of localMap) {
    try {
      const supabaseRecord = supabaseMap.get(id);

      if (!supabaseRecord) {
        // Registro existe apenas no Local - inserir no Supabase
        const supabaseData = prepareDataForSupabase(localRecord);
        const { error } = await supabase.from(tableName).insert(supabaseData);

        if (error) throw error;
        syncedCount++;
      } else {
        // Registro existe em ambos - verificar se precisa atualizar
        const needsUpdate = needsUpdateRecord(supabaseRecord, localRecord);
        if (needsUpdate) {
          const supabaseData = prepareDataForSupabase(localRecord);
          const { error } = await supabase
            .from(tableName)
            .update(supabaseData)
            .eq("id", id);

          if (error) throw error;
          syncedCount++;
        }
      }
    } catch (error) {
      console.error(
        `❌ Erro ao sincronizar registro ${id} do Local para Supabase:`,
        error
      );
      errorCount++;
    }
  }

  return {
    table: tableName,
    synced: syncedCount,
    errors: errorCount,
    total: Math.max(localData.length, supabaseRecords.length),
    success: true,
    direction: "bidirectional",
  };
}

function needsUpdateRecord(record1: any, record2: any): boolean {
  // Comparar campos relevantes (ignorar timestamps automáticos)
  const fieldsToCompare = Object.keys(record1).filter(
    (key) =>
      !key.includes("created_at") && !key.includes("updated_at") && key !== "id"
  );

  for (const field of fieldsToCompare) {
    if (record1[field] !== record2[field]) {
      return true;
    }
  }

  return false;
}

function prepareDataForSupabase(data: any): any {
  const prepared = { ...data };

  // O Supabase espera camelCase, mas o banco local usa snake_case
  // Não fazer mapeamento - deixar como está
  // O Supabase deve aceitar snake_case também

  Object.keys(prepared).forEach((key) => {
    if (prepared[key] instanceof Date) {
      prepared[key] = prepared[key].toISOString();
    }
  });

  return prepared;
}

function prepareDataForPrisma(data: any): any {
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

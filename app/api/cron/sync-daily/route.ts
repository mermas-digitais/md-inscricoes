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

export async function GET(request: NextRequest) {
  // Verificar se é uma chamada autorizada do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🕐 Iniciando sincronização diária automática");

    const results = [];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const tableName of COMMON_TABLES) {
      try {
        const result = await syncTableBidirectional(tableName);
        results.push(result);
        totalSynced += result.synced;
        totalErrors += result.errors;

        console.log(
          `✅ ${tableName}: ${result.synced} registros sincronizados, ${result.errors} erros`
        );
      } catch (error) {
        console.error(`❌ Erro na tabela ${tableName}:`, error);
        totalErrors++;
      }
    }

    console.log(
      `🎉 Sincronização diária finalizada: ${totalSynced} registros sincronizados, ${totalErrors} erros`
    );

    // Log do resultado para monitoramento
    const logData = {
      timestamp: new Date().toISOString(),
      type: "daily_sync",
      totalSynced,
      totalErrors,
      tablesProcessed: TABLES.length,
      results,
    };

    // Salvar log no Supabase (opcional)
    try {
      await supabase.from("sync_logs").insert({
        timestamp: new Date().toISOString(),
        type: "daily_sync",
        total_synced: totalSynced,
        total_errors: totalErrors,
        tables_processed: COMMON_TABLES.length,
        details: logData,
      });
    } catch (logError) {
      console.error("Erro ao salvar log:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Sincronização diária concluída",
      timestamp: new Date().toISOString(),
      summary: {
        totalSynced,
        totalErrors,
        tablesProcessed: COMMON_TABLES.length,
      },
    });
  } catch (error) {
    console.error("❌ Erro na sincronização diária:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function syncTableBidirectional(tableName: string) {
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

  // O Supabase deve aceitar snake_case também
  // Não fazer mapeamento - deixar como está

  Object.keys(prepared).forEach((key) => {
    if (prepared[key] instanceof Date) {
      prepared[key] = prepared[key].toISOString();
    }
  });

  return prepared;
}

function prepareDataForPrisma(data: any): any {
  const prepared = { ...data };

  // O banco local usa snake_case, não fazer mapeamento
  // Deixar como está

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

  return prepared;
}

function isDateString(str: string): boolean {
  // Aceitar tanto formato ISO completo quanto apenas data
  // Incluir formato com timezone offset (+00:00)
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    str
  );
}

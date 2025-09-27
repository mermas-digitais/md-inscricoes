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
    const { tableName, direction = "bidirectional" } = await request.json();

    if (!tableName) {
      return NextResponse.json(
        { error: "Nome da tabela é obrigatório" },
        { status: 400 }
      );
    }

    if (!COMMON_TABLES.includes(tableName)) {
      return NextResponse.json(
        {
          error: `Tabela '${tableName}' não pode ser sincronizada. Tabelas disponíveis: ${COMMON_TABLES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `🔄 Iniciando sincronização da tabela: ${tableName} (${direction})`
    );

    let result: SyncResult;

    // Todas as tabelas são comuns agora
    switch (direction) {
      case "to-supabase":
        result = await syncTableToSupabase(tableName);
        break;
      case "from-supabase":
        result = await syncTableFromSupabase(tableName);
        break;
      case "bidirectional":
        result = await syncTableBidirectional(tableName);
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Direção inválida. Use: 'to-supabase', 'from-supabase' ou 'bidirectional'",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
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
  }
}

async function syncTableBidirectional(tableName: string): Promise<SyncResult> {
  console.log(`📊 Sincronizando tabela bidirecional: ${tableName}`);

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

    // Buscar dados de ambos os bancos
    const [localData, supabaseData] = await Promise.all([
      (prisma as any)[modelName].findMany({
        orderBy: { id: "asc" },
      }),
      supabase.from(tableName).select("*").order("id"),
    ]);

    if (supabaseData.error) {
      throw new Error(
        `Erro ao buscar dados do Supabase: ${supabaseData.error.message}`
      );
    }

    const localRecords = localData || [];
    const supabaseRecords = supabaseData.data || [];

    console.log(
      `📋 Local: ${localRecords.length} registros, Supabase: ${supabaseRecords.length} registros`
    );

    let syncedCount = 0;
    let errorCount = 0;

    // Sincronizar do Supabase para Local
    for (const supabaseRecord of supabaseRecords) {
      const id = supabaseRecord.id;
      try {
        const localRecord = localRecords.find((r: any) => r.id === id);

        if (!localRecord) {
          // Registro não existe localmente - criar
          const prismaData = prepareDataForPrisma(supabaseRecord);
          await (prisma as any)[modelName].create({ data: prismaData });
          syncedCount++;
        } else {
          // Registro existe em ambos - verificar se precisa atualizar
          const needsUpdate = needsUpdateRecord(localRecord, supabaseRecord);
          if (needsUpdate) {
            const prismaData = prepareDataForPrisma(supabaseRecord);
            await (prisma as any)[modelName].update({
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

    // Sincronizar do Local para Supabase
    for (const localRecord of localRecords) {
      const id = localRecord.id;
      try {
        const supabaseRecord = supabaseRecords.find((r: any) => r.id === id);

        if (!supabaseRecord) {
          // Registro não existe no Supabase - criar
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

    console.log(
      `✅ ${tableName}: ${syncedCount} registros sincronizados, ${errorCount} erros`
    );

    return {
      table: tableName,
      synced: syncedCount,
      errors: errorCount,
      total: localRecords.length + supabaseRecords.length,
      success: errorCount === 0,
      direction: "bidirectional",
    };
  } catch (error) {
    console.error(`❌ Erro na tabela ${tableName}:`, error);
    return {
      table: tableName,
      synced: 0,
      errors: 1,
      total: 0,
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      direction: "bidirectional",
    };
  }
}

async function syncTableToSupabase(tableName: string): Promise<SyncResult> {
  console.log(`📤 Sincronizando ${tableName} para Supabase`);

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

    const localData = await (prisma as any)[modelName].findMany({
      orderBy: { id: "asc" },
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const record of localData) {
      try {
        const supabaseData = prepareDataForSupabase(record);
        const { error } = await supabase.from(tableName).upsert(supabaseData);

        if (error) throw error;
        syncedCount++;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar registro ${record.id}:`, error);
        errorCount++;
      }
    }

    return {
      table: tableName,
      synced: syncedCount,
      errors: errorCount,
      total: localData.length,
      success: errorCount === 0,
      direction: "to-supabase",
    };
  } catch (error) {
    return {
      table: tableName,
      synced: 0,
      errors: 1,
      total: 0,
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      direction: "to-supabase",
    };
  }
}

async function syncTableFromSupabase(tableName: string): Promise<SyncResult> {
  console.log(`📥 Sincronizando ${tableName} do Supabase`);

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

    const { data: supabaseData, error } = await supabase
      .from(tableName)
      .select("*")
      .order("id");

    if (error) {
      throw new Error(`Erro ao buscar dados do Supabase: ${error.message}`);
    }

    let syncedCount = 0;
    let errorCount = 0;

    for (const record of supabaseData || []) {
      try {
        const prismaData = prepareDataForPrisma(record);
        await (prisma as any)[modelName].upsert({
          where: { id: record.id },
          update: prismaData,
          create: prismaData,
        });
        syncedCount++;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar registro ${record.id}:`, error);
        errorCount++;
      }
    }

    return {
      table: tableName,
      synced: syncedCount,
      errors: errorCount,
      total: supabaseData?.length || 0,
      success: errorCount === 0,
      direction: "from-supabase",
    };
  } catch (error) {
    return {
      table: tableName,
      synced: 0,
      errors: 1,
      total: 0,
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      direction: "from-supabase",
    };
  }
}

function needsUpdateRecord(record1: any, record2: any): boolean {
  // Comparar campos relevantes (excluir timestamps automáticos)
  const fieldsToCompare = Object.keys(record1).filter(
    (key) =>
      !["created_at", "updated_at", "createdAt", "updatedAt"].includes(key)
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

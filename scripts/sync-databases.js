#!/usr/bin/env node

require('dotenv').config();
// Corrigir DATABASE_URL removendo aspas
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.slice(1, -1);
}

const { PrismaClient } = require("../lib/generated/prisma");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

async function syncTableBidirectional(tableName) {
  console.log(`📊 Sincronizando tabela: ${tableName}`);

  try {
    // Buscar dados de ambos os bancos
    const [localData, supabaseData] = await Promise.all([
      prisma[tableName].findMany({ orderBy: { id: "asc" } }),
      supabase.from(tableName).select("*").order("id", { ascending: true }),
    ]);

    if (supabaseData.error) {
      throw new Error(
        `Erro ao buscar dados do Supabase: ${supabaseData.error.message}`
      );
    }

    const supabaseRecords = supabaseData.data || [];

    // Criar mapas para comparação rápida
    const localMap = new Map(localData.map((item) => [item.id, item]));
    const supabaseMap = new Map(supabaseRecords.map((item) => [item.id, item]));

    let syncedCount = 0;
    let errorCount = 0;

    // Sincronizar registros do Supabase para o Local
    for (const [id, supabaseRecord] of supabaseMap) {
      try {
        const localRecord = localMap.get(id);

        if (!localRecord) {
          // Registro existe apenas no Supabase - inserir no local
          const prismaData = prepareDataForPrisma(supabaseRecord);
          await prisma[tableName].create({ data: prismaData });
          syncedCount++;
        } else {
          // Registro existe em ambos - verificar se precisa atualizar
          const needsUpdate = needsUpdateRecord(localRecord, supabaseRecord);
          if (needsUpdate) {
            const prismaData = prepareDataForPrisma(supabaseRecord);
            await prisma[tableName].update({
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
  } catch (error) {
    console.error(`❌ Erro na tabela ${tableName}:`, error);
    return {
      table: tableName,
      synced: 0,
      errors: 1,
      total: 0,
    };
  }
}

function needsUpdateRecord(record1, record2) {
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

function prepareDataForSupabase(data) {
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

function prepareDataForPrisma(data) {
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

function isDateString(str) {
  // Aceitar tanto formato ISO completo quanto apenas data
  // Incluir formato com timezone offset (+00:00)
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    str
  );
}

async function main() {
  const direction = process.argv[2];

  if (
    !direction ||
    !["to-supabase", "from-supabase", "bidirectional"].includes(direction)
  ) {
    console.log("Uso: node sync-databases.js <direction>");
    console.log("Direções disponíveis:");
    console.log(
      "  to-supabase    - Sincronizar do banco local para o Supabase"
    );
    console.log(
      "  from-supabase  - Sincronizar do Supabase para o banco local"
    );
    console.log("  bidirectional  - Sincronização bidirecional inteligente");
    process.exit(1);
  }

  try {
    console.log(`🔄 Iniciando sincronização: ${direction}`);

    const results = [];
    let totalSynced = 0;
    let totalErrors = 0;

    for (const tableName of COMMON_TABLES) {
      const result = await syncTableBidirectional(tableName);
      results.push(result);
      totalSynced += result.synced;
      totalErrors += result.errors;

      console.log(
        `✅ ${tableName}: ${result.synced} registros sincronizados, ${result.errors} erros`
      );
    }

    console.log(
      `🎉 Sincronização finalizada: ${totalSynced} registros sincronizados, ${totalErrors} erros`
    );

    // Resumo
    console.log("\n📊 Resumo:");
    results.forEach((result) => {
      console.log(
        `  ${result.table}: ${result.synced} sincronizados, ${result.errors} erros`
      );
    });
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

#!/usr/bin/env node

require("dotenv").config();
// Corrigir DATABASE_URL removendo aspas
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('"')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.slice(1, -1);
}

const { PrismaClient } = require("../lib/generated/prisma");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento de campos snake_case para camelCase
const FIELD_MAPPING = {
  // Tabela cursos
  cursos: {
    nome_curso: "nomeCurso",
    carga_horaria: "cargaHoraria",
    publico_alvo: "publicoAlvo",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  // Tabela turmas
  turmas: {
    curso_id: "cursoId",
    codigo_turma: "codigoTurma",
    ano_letivo: "anoLetivo",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  // Tabela aulas
  aulas: {
    turma_id: "turmaId",
    data_aula: "dataAula",
    conteudo_ministrado: "conteudoMinistrado",
    modulo_id: "moduloId",
    nome_aula: "nomeAula",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  // Tabela modulos
  modulos: {
    turma_id: "turmaId",
    nome_modulo: "nomeModulo",
    quantidade_aulas: "quantidadeAulas",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  // Tabela frequencia
  frequencia: {
    aula_id: "aulaId",
    aluna_id: "alunaId",
    created_at: "createdAt",
  },
  // Tabela turmas_alunas
  turmas_alunas: {
    turma_id: "turmaId",
    aluna_id: "alunaId",
    created_at: "createdAt",
  },
  // Tabela turmas_monitores
  turmas_monitores: {
    turma_id: "turmaId",
    monitor_id: "monitorId",
    created_at: "createdAt",
  },
  // Tabela materiais_aula
  materiais_aula: {
    aula_id: "aulaId",
    nome_material: "nomeMaterial",
    tipo_material: "tipoMaterial",
    url_material: "urlMaterial",
    created_at: "createdAt",
  },
  // Tabela inscricoes_eventos
  inscricoes_eventos: {
    evento_id: "eventoId",
    orientador_id: "orientadorId",
    modalidade_id: "modalidadeId",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  // Tabela participantes_eventos
  participantes_eventos: {
    inscricao_id: "inscricaoId",
    data_nascimento: "dataNascimento",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
};

function prepareDataForPrisma(data, tableName) {
  const prepared = { ...data };

  // Aplicar mapeamento de campos se existir
  if (FIELD_MAPPING[tableName]) {
    const mapping = FIELD_MAPPING[tableName];
    Object.keys(mapping).forEach((snakeField) => {
      const camelField = mapping[snakeField];
      if (prepared[snakeField] !== undefined) {
        prepared[camelField] = prepared[snakeField];
        delete prepared[snakeField];
      }
    });
  }

  // Converter datas
  Object.keys(prepared).forEach((key) => {
    if (typeof prepared[key] === "string" && isDateString(prepared[key])) {
      if (prepared[key].match(/^\d{4}-\d{2}-\d{2}$/)) {
        prepared[key] = new Date(prepared[key] + "T00:00:00.000Z");
      } else {
        prepared[key] = new Date(prepared[key]);
      }
    }
  });

  return prepared;
}

function isDateString(str) {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    str
  );
}

async function syncTableFromSupabase(tableName) {
  try {
    console.log(`📊 Sincronizando tabela: ${tableName}`);

    // Buscar dados do Supabase
    const { data: supabaseData, error } = await supabase
      .from(tableName)
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(
        `❌ Erro ao buscar dados do Supabase para ${tableName}:`,
        error
      );
      return { synced: 0, errors: 1 };
    }

    if (!supabaseData || supabaseData.length === 0) {
      console.log(`✅ ${tableName}: 0 registros (tabela vazia)`);
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // Mapear nome da tabela para o modelo Prisma
    const modelMap = {
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

    const modelName = modelMap[tableName];
    if (!modelName) {
      console.error(`❌ Modelo não encontrado para tabela: ${tableName}`);
      return { synced: 0, errors: 1 };
    }

    // Verificar se o modelo existe no Prisma
    if (!prisma[modelName]) {
      console.error(`❌ Modelo Prisma não encontrado: ${modelName}`);
      return { synced: 0, errors: 1 };
    }

    // Buscar dados locais existentes
    const localData = await prisma[modelName].findMany({
      select: { id: true },
    });
    const localIds = new Set(localData.map((item) => item.id));

    // Inserir apenas registros que não existem localmente
    for (const record of supabaseData) {
      if (!localIds.has(record.id)) {
        try {
          const prismaData = prepareDataForPrisma(record, tableName);
          await prisma[modelName].create({ data: prismaData });
          synced++;
        } catch (error) {
          console.error(
            `❌ Erro ao inserir registro ${record.id} do Supabase para Local:`,
            error.message
          );
          errors++;
        }
      }
    }

    console.log(
      `✅ ${tableName}: ${synced} registros sincronizados, ${errors} erros`
    );
    return { synced, errors };
  } catch (error) {
    console.error(`❌ Erro na tabela ${tableName}:`, error.message);
    return { synced: 0, errors: 1 };
  }
}

async function main() {
  console.log("🔄 Iniciando sincronização corrigida do Supabase para Local");

  const tablesToSync = [
    "cursos",
    "turmas",
    "aulas",
    "modulos",
    "frequencia",
    "turmas_alunas",
    "turmas_monitores",
    "materiais_aula",
    "inscricoes_eventos",
    "participantes_eventos",
  ];

  let totalSynced = 0;
  let totalErrors = 0;

  for (const table of tablesToSync) {
    const result = await syncTableFromSupabase(table);
    totalSynced += result.synced;
    totalErrors += result.errors;
  }

  console.log(
    `🎉 Sincronização finalizada: ${totalSynced} registros sincronizados, ${totalErrors} erros`
  );

  await prisma.$disconnect();
}

main().catch(console.error);

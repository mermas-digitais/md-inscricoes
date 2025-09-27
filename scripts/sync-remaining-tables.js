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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncRemainingTables() {
  console.log("🔄 Sincronizando tabelas restantes...");

  // 1. Sincronizar cursos restantes
  console.log("📊 Sincronizando cursos restantes...");
  try {
    const { data: cursosData } = await supabase
      .from("cursos")
      .select("*")
      .order("id", { ascending: true });

    const localCursos = await prisma.cursos.findMany({
      select: { id: true },
    });
    const localCursosIds = new Set(localCursos.map((c) => c.id));

    for (const curso of cursosData) {
      if (!localCursosIds.has(curso.id)) {
        try {
          await prisma.cursos.create({
            data: {
              id: curso.id,
              nomeCurso: curso.nome_curso,
              descricao: curso.descricao,
              cargaHoraria: curso.carga_horaria,
              publicoAlvo: curso.publico_alvo,
              status: curso.status,
              projeto:
                curso.projeto === "Mermãs Digitais"
                  ? "Mermãs Digitais"
                  : "Meninas STEM",
              createdAt: new Date(curso.created_at),
            },
          });
          console.log(`✅ Curso ${curso.nome_curso} sincronizado`);
        } catch (error) {
          console.error(
            `❌ Erro ao sincronizar curso ${curso.id}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar cursos:", error.message);
  }

  // 2. Sincronizar turmas restantes
  console.log("📊 Sincronizando turmas restantes...");
  try {
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .order("id", { ascending: true });

    const localTurmas = await prisma.turmas.findMany({
      select: { id: true },
    });
    const localTurmasIds = new Set(localTurmas.map((t) => t.id));

    for (const turma of turmasData) {
      if (!localTurmasIds.has(turma.id)) {
        try {
          await prisma.turmas.create({
            data: {
              id: turma.id,
              cursoId: turma.curso_id,
              codigoTurma: turma.codigo_turma,
              anoLetivo: turma.ano_letivo,
              status: turma.status,
              descricao: turma.descricao,
              semestre: turma.semestre,
              createdAt: new Date(turma.created_at),
              updatedAt: new Date(turma.updated_at),
            },
          });
          console.log(`✅ Turma ${turma.codigo_turma} sincronizada`);
        } catch (error) {
          console.error(
            `❌ Erro ao sincronizar turma ${turma.id}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar turmas:", error.message);
  }

  // 3. Sincronizar aulas restantes
  console.log("📊 Sincronizando aulas restantes...");
  try {
    const { data: aulasData } = await supabase
      .from("aulas")
      .select("*")
      .order("id", { ascending: true });

    const localAulas = await prisma.aulas.findMany({
      select: { id: true },
    });
    const localAulasIds = new Set(localAulas.map((a) => a.id));

    for (const aula of aulasData) {
      if (!localAulasIds.has(aula.id)) {
        try {
          await prisma.aulas.create({
            data: {
              id: aula.id,
              turmaId: aula.turma_id,
              dataAula: aula.data_aula ? new Date(aula.data_aula) : null,
              conteudoMinistrado: aula.conteudo_ministrado,
              moduloId: aula.modulo_id,
              nomeAula: aula.nome_aula,
              ordem: aula.ordem,
              status: aula.status,
              createdAt: new Date(aula.created_at),
            },
          });
          console.log(`✅ Aula ${aula.nome_aula || aula.id} sincronizada`);
        } catch (error) {
          console.error(
            `❌ Erro ao sincronizar aula ${aula.id}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar aulas:", error.message);
  }

  // 4. Sincronizar tabelas de relacionamento (sem ID próprio)
  console.log("📊 Sincronizando tabelas de relacionamento...");

  // Frequencia
  try {
    const { data: frequenciaData } = await supabase
      .from("frequencia")
      .select("*");

    if (frequenciaData && frequenciaData.length > 0) {
      for (const freq of frequenciaData) {
        try {
          await prisma.frequencia.upsert({
            where: {
              aulaId_alunaId: {
                aulaId: freq.aula_id,
                alunaId: freq.aluna_id,
              },
            },
            update: {
              presente: freq.presente,
              createdAt: new Date(freq.created_at),
            },
            create: {
              aulaId: freq.aula_id,
              alunaId: freq.aluna_id,
              presente: freq.presente,
              createdAt: new Date(freq.created_at),
            },
          });
          console.log(`✅ Frequencia sincronizada`);
        } catch (error) {
          console.error(`❌ Erro ao sincronizar frequencia:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar frequencia:", error.message);
  }

  // Turmas Alunas
  try {
    const { data: turmasAlunasData } = await supabase
      .from("turmas_alunas")
      .select("*");

    if (turmasAlunasData && turmasAlunasData.length > 0) {
      for (const ta of turmasAlunasData) {
        try {
          await prisma.turmasAlunas.upsert({
            where: {
              alunaId_turmaId: {
                alunaId: ta.aluna_id,
                turmaId: ta.turma_id,
              },
            },
            update: {
              createdAt: new Date(ta.created_at),
            },
            create: {
              alunaId: ta.aluna_id,
              turmaId: ta.turma_id,
              createdAt: new Date(ta.created_at),
            },
          });
          console.log(`✅ Turma-Aluna sincronizada`);
        } catch (error) {
          console.error(`❌ Erro ao sincronizar turma-aluna:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar turmas_alunas:", error.message);
  }

  // Turmas Monitores
  try {
    const { data: turmasMonitoresData } = await supabase
      .from("turmas_monitores")
      .select("*");

    if (turmasMonitoresData && turmasMonitoresData.length > 0) {
      for (const tm of turmasMonitoresData) {
        try {
          await prisma.turmasMonitores.upsert({
            where: {
              monitorId_turmaId: {
                monitorId: tm.monitor_id,
                turmaId: tm.turma_id,
              },
            },
            update: {
              createdAt: new Date(tm.created_at),
            },
            create: {
              monitorId: tm.monitor_id,
              turmaId: tm.turma_id,
              createdAt: new Date(tm.created_at),
            },
          });
          console.log(`✅ Turma-Monitor sincronizada`);
        } catch (error) {
          console.error(`❌ Erro ao sincronizar turma-monitor:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao sincronizar turmas_monitores:", error.message);
  }

  console.log("🎉 Sincronização das tabelas restantes finalizada!");
  await prisma.$disconnect();
}

syncRemainingTables().catch(console.error);

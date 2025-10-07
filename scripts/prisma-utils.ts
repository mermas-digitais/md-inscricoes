import { prisma } from "../lib/prisma";

// ===============================================
// UTILITÁRIOS DO PRISMA
// ===============================================

export class PrismaUtils {
  // Conectar ao banco
  static async connect() {
    await prisma.$connect();
    console.log("✅ Conectado ao banco via Prisma");
  }

  // Desconectar do banco
  static async disconnect() {
    await prisma.$disconnect();
    console.log("✅ Desconectado do banco via Prisma");
  }

  // Verificar status do banco
  static async getStatus() {
    try {
      const inscricoesCount = await prisma.inscricoes.count();
      const monitoresCount = await prisma.monitores.count();
      const escolasCount = await prisma.escolas.count();
      const eventosCount = await prisma.eventos.count();
      const orientadoresCount = await prisma.orientadores.count();
      const modalidadesCount = await prisma.modalidades.count();

      return {
        status: "connected",
        tables: {
          inscricoes: inscricoesCount,
          monitores: monitoresCount,
          escolas: escolasCount,
          eventos: eventosCount,
          orientadores: orientadoresCount,
          modalidades: modalidadesCount,
        },
        total:
          inscricoesCount +
          monitoresCount +
          escolasCount +
          eventosCount +
          orientadoresCount +
          modalidadesCount,
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // Limpar dados de teste
  static async clearTestData() {
    try {
      console.log("🧹 Limpando dados de teste...");

      // Limpar em ordem para respeitar foreign keys
      await prisma.frequencia.deleteMany();
      await prisma.materiaisAula.deleteMany();
      await prisma.aulas.deleteMany();
      await prisma.modulos.deleteMany();
      await prisma.turmasAlunas.deleteMany();
      await prisma.turmasMonitores.deleteMany();
      await prisma.turmas.deleteMany();
      await prisma.cursos.deleteMany();
      await prisma.verificationCodes.deleteMany();
      await prisma.inscricoes.deleteMany();
      await prisma.monitores.deleteMany();
      await prisma.escolas.deleteMany();

      // Limpar dados de eventos
      await prisma.participantesEventos.deleteMany();
      await prisma.inscricoesEventos.deleteMany();
      await prisma.modalidades.deleteMany();
      await prisma.orientadores.deleteMany();
      await prisma.eventos.deleteMany();

      console.log("✅ Dados de teste removidos com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao limpar dados:", error);
      throw error;
    }
  }

  // Criar dados de exemplo
  static async seedExampleData() {
    try {
      console.log("🌱 Criando dados de exemplo...");

      // Criar escolas
      const escola1 = await prisma.escolas.create({
        data: {
          nome: "Escola Municipal de Teste",
          tipo: "Municipal",
          cidade: "Imperatriz",
          estado: "MA",
        },
      });

      // Criar monitores
      const monitor1 = await prisma.monitores.create({
        data: {
          nome: "Monitor de Teste",
          email: "monitor@teste.com",
          role: "MONITOR",
        },
      });

      // Criar curso
      const curso1 = await prisma.cursos.create({
        data: {
          nomeCurso: "Curso de Teste",
          descricao: "Curso para testes",
          cargaHoraria: 40,
          publicoAlvo: "Ensino Médio",
          status: "ATIVO",
          projeto: "Mermãs Digitais",
        },
      });

      // Criar turma
      const turma1 = await prisma.turmas.create({
        data: {
          cursoId: curso1.id,
          codigoTurma: "TEST-2025.1",
          anoLetivo: 2025,
          status: "Ativa",
          descricao: "Turma de teste",
          semestre: 1,
        },
      });

      // Associar monitor à turma
      await prisma.turmasMonitores.create({
        data: {
          turmaId: turma1.id,
          monitorId: monitor1.id,
        },
      });

      // Criar evento
      const evento1 = await prisma.eventos.create({
        data: {
          nome: "Evento de Teste",
          descricao: "Evento para testes do sistema",
          dataInicio: new Date("2025-01-01T09:00:00Z"),
          dataFim: new Date("2025-01-01T17:00:00Z"),
          ativo: true,
        },
      });

      // Criar modalidade
      const modalidade1 = await prisma.modalidades.create({
        data: {
          eventoId: evento1.id,
          nome: "Modalidade de Teste",
          descricao: "Modalidade para testes",
          limiteVagas: 50,
          vagasOcupadas: 0,
          ativo: true,
        },
      });

      // Criar orientador
      const orientador1 = await prisma.orientadores.create({
        data: {
          nome: "Orientador de Teste",
          cpf: "12345678901",
          telefone: "999999999",
          email: "orientador@teste.com",
          escola: "Escola de Teste",
          genero: "Masculino",
          ativo: true,
        },
      });

      console.log("✅ Dados de exemplo criados com sucesso!");
      console.log(`  - Escola: ${escola1.nome}`);
      console.log(`  - Monitor: ${monitor1.nome}`);
      console.log(`  - Curso: ${curso1.nomeCurso}`);
      console.log(`  - Turma: ${turma1.codigoTurma}`);
      console.log(`  - Evento: ${evento1.nome}`);
      console.log(`  - Modalidade: ${modalidade1.nome}`);
      console.log(`  - Orientador: ${orientador1.nome}`);
    } catch (error) {
      console.error("❌ Erro ao criar dados de exemplo:", error);
      throw error;
    }
  }

  // Backup dos dados
  static async backup() {
    try {
      console.log("💾 Criando backup dos dados...");

      const backup = {
        timestamp: new Date().toISOString(),
        inscricoes: await prisma.inscricoes.findMany(),
        monitores: await prisma.monitores.findMany(),
        escolas: await prisma.escolas.findMany(),
        cursos: await prisma.cursos.findMany(),
        turmas: await prisma.turmas.findMany(),
        eventos: await prisma.eventos.findMany(),
        orientadores: await prisma.orientadores.findMany(),
        modalidades: await prisma.modalidades.findMany(),
      };

      const filename = `backup-${new Date().toISOString().split("T")[0]}.json`;
      const fs = await import("fs/promises");
      await fs.writeFile(
        `backups/${filename}`,
        JSON.stringify(backup, null, 2)
      );

      console.log(`✅ Backup criado: ${filename}`);
      return filename;
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      throw error;
    }
  }

  // Estatísticas do banco
  static async getStats() {
    try {
      const stats = await this.getStatus();

      if (stats.status === "connected") {
        console.log("\n📊 ESTATÍSTICAS DO BANCO:");
        console.log("================================");
        console.log(`📝 Inscrições: ${stats.tables.inscricoes}`);
        console.log(`👨‍🏫 Monitores: ${stats.tables.monitores}`);
        console.log(`🏫 Escolas: ${stats.tables.escolas}`);
        console.log(`🎉 Eventos: ${stats.tables.eventos}`);
        console.log(`👥 Orientadores: ${stats.tables.orientadores}`);
        console.log(`🎯 Modalidades: ${stats.tables.modalidades}`);
        console.log(`📊 Total de registros: ${stats.total}`);
        console.log("================================");
      }

      return stats;
    } catch (error) {
      console.error("❌ Erro ao obter estatísticas:", error);
      throw error;
    }
  }
}

// ===============================================
// COMANDOS CLI
// ===============================================

async function main() {
  const command = process.argv[2];

  try {
    await PrismaUtils.connect();

    switch (command) {
      case "status":
        await PrismaUtils.getStats();
        break;

      case "clear":
        await PrismaUtils.clearTestData();
        break;

      case "seed":
        await PrismaUtils.seedExampleData();
        break;

      case "backup":
        await PrismaUtils.backup();
        break;

      default:
        console.log("🔧 Comandos disponíveis:");
        console.log("  status  - Mostrar estatísticas do banco");
        console.log("  clear   - Limpar dados de teste");
        console.log("  seed    - Criar dados de exemplo");
        console.log("  backup  - Criar backup dos dados");
    }
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  } finally {
    await PrismaUtils.disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

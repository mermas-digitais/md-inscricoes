import { prisma } from "../lib/prisma";

async function testPrismaConnection() {
  try {
    console.log("🔍 Testando conexão com Prisma...");

    // Testar conexão básica
    await prisma.$connect();
    console.log("✅ Conexão estabelecida com sucesso!");

    // Testar contagem de registros
    const inscricoesCount = await prisma.inscricoes.count();
    const monitoresCount = await prisma.monitores.count();
    const escolasCount = await prisma.escolas.count();
    const eventosCount = await prisma.eventos.count();

    console.log("\n📊 Contagem de registros:");
    console.log(`  - Inscrições: ${inscricoesCount}`);
    console.log(`  - Monitores: ${monitoresCount}`);
    console.log(`  - Escolas: ${escolasCount}`);
    console.log(`  - Eventos: ${eventosCount}`);

    // Testar uma query mais complexa
    const inscricoesRecentes = await prisma.inscricoes.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    console.log("\n📝 Últimas 5 inscrições:");
    inscricoesRecentes.forEach((inscricao, index) => {
      console.log(
        `  ${index + 1}. ${inscricao.nome} (${inscricao.email}) - ${
          inscricao.status
        }`
      );
    });

    // Testar relacionamentos
    const turmasComCursos = await prisma.turmas.findMany({
      take: 3,
      include: {
        curso: true,
        turmasMonitores: {
          include: {
            monitor: true,
          },
        },
      },
    });

    console.log("\n🎓 Turmas com cursos e monitores:");
    turmasComCursos.forEach((turma, index) => {
      console.log(
        `  ${index + 1}. ${turma.codigoTurma} - ${turma.curso.nomeCurso}`
      );
      console.log(
        `     Monitores: ${turma.turmasMonitores
          .map((tm) => tm.monitor.nome)
          .join(", ")}`
      );
    });

    console.log("\n🎉 Teste do Prisma concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao testar Prisma:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testPrismaConnection();

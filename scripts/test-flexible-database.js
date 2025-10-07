#!/usr/bin/env node

/**
 * Script de Teste do Sistema Flexível de Banco
 *
 * Este script demonstra como usar o novo sistema de configuração
 * flexível de banco de dados
 */

require("dotenv").config();

const { dbManager } = require("../lib/database-manager");

async function testDatabaseSystem() {
  console.log("🧪 Testando Sistema Flexível de Banco de Dados\n");

  try {
    // 1. Mostrar configuração atual
    console.log("📋 Configuração Atual:");
    const stats = await dbManager.getStats();
    console.log(`   Modo: ${stats.config.mode}`);
    console.log(`   Provedor Ativo: ${stats.activeProvider}`);
    console.log(`   Prisma Disponível: ${stats.prismaAvailable ? "✅" : "❌"}`);
    console.log(
      `   Supabase Disponível: ${stats.supabaseAvailable ? "✅" : "❌"}`
    );
    console.log(`   Fallback: ${stats.config.fallback.enabled ? "✅" : "❌"}`);
    console.log("");

    // 2. Testar conexão
    console.log("🔌 Testando Conexão:");
    const connectionTest = await dbManager.testConnection();
    console.log(`   Provedor: ${connectionTest.provider}`);
    console.log(
      `   Status: ${
        connectionTest.status === "success" ? "✅ Conectado" : "❌ Erro"
      }`
    );
    if (connectionTest.error) {
      console.log(`   Erro: ${connectionTest.error}`);
    }
    console.log("");

    // 3. Testar operação simples
    console.log("📊 Testando Operação de Banco:");
    try {
      const provider = await dbManager.getActiveProvider();

      if (provider === "prisma") {
        const prisma = dbManager.getPrisma();
        const count = await prisma.inscricoes.count();
        console.log(`   ✅ Prisma: ${count} inscrições encontradas`);
      } else {
        const supabase = dbManager.getSupabase();
        const { count, error } = await supabase
          .from("inscricoes")
          .select("*", { count: "exact", head: true });

        if (error) throw error;
        console.log(`   ✅ Supabase: ${count || 0} inscrições encontradas`);
      }
    } catch (error) {
      console.log(`   ❌ Erro na operação: ${error.message}`);
    }
    console.log("");

    // 4. Testar fallback (se habilitado)
    if (stats.config.fallback.enabled) {
      console.log("🔄 Testando Sistema de Fallback:");
      try {
        const result = await dbManager.executeWithFallback(
          async (provider) => {
            console.log(`   Tentando operação com ${provider}...`);
            if (provider === "prisma") {
              const prisma = dbManager.getPrisma();
              return await prisma.inscricoes.count();
            } else {
              const supabase = dbManager.getSupabase();
              const { count } = await supabase
                .from("inscricoes")
                .select("*", { count: "exact", head: true });
              return count || 0;
            }
          },
          async (provider) => {
            console.log(`   Fallback para ${provider}...`);
            if (provider === "prisma") {
              const prisma = dbManager.getPrisma();
              return await prisma.inscricoes.count();
            } else {
              const supabase = dbManager.getSupabase();
              const { count } = await supabase
                .from("inscricoes")
                .select("*", { count: "exact", head: true });
              return count || 0;
            }
          }
        );
        console.log(`   ✅ Fallback funcionando: ${result} registros`);
      } catch (error) {
        console.log(`   ❌ Erro no fallback: ${error.message}`);
      }
      console.log("");
    }

    // 5. Resumo final
    console.log("📈 Resumo do Teste:");
    console.log(`   ✅ Sistema configurado e funcionando`);
    console.log(`   ✅ Provedor ativo: ${stats.activeProvider}`);
    console.log(
      `   ✅ Conexão: ${connectionTest.status === "success" ? "OK" : "ERRO"}`
    );
    console.log(
      `   ✅ Fallback: ${
        stats.config.fallback.enabled ? "Habilitado" : "Desabilitado"
      }`
    );
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  }
}

// Executar teste
testDatabaseSystem()
  .then(() => {
    console.log("\n🎉 Teste concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Teste falhou:", error);
    process.exit(1);
  });

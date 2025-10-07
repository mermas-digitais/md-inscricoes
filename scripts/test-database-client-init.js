#!/usr/bin/env node

/**
 * Script para testar a inicialização do DatabaseClient
 */

// Carregar variáveis de ambiente
require("dotenv").config();

console.log("🧪 Testando inicialização do DatabaseClient...\n");

// Função para testar inicialização do DatabaseClient
async function testDatabaseClientInit() {
  try {
    console.log("📦 Testando import do DatabaseClient...");

    // Importar o DatabaseClient
    const { getDatabaseClient } = require("../lib/clients/database-client");

    console.log("✅ Import do DatabaseClient - OK");

    console.log("🔧 Testando inicialização do DatabaseClient...");

    // Tentar inicializar o DatabaseClient
    const dbClient = await getDatabaseClient();

    console.log("✅ Inicialização do DatabaseClient - OK");

    console.log("🔍 Testando método getProvider...");

    // Testar método getProvider
    const provider = dbClient.getProvider();
    console.log(`✅ Provider: ${provider}`);

    console.log("🔍 Testando método testConnection...");

    // Testar método testConnection
    const connectionOk = await dbClient.testConnection();
    console.log(`✅ Conexão: ${connectionOk ? "OK" : "FALHOU"}`);

    return true;
  } catch (error) {
    console.log(`❌ Erro na inicialização do DatabaseClient: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Função para testar inicialização do VerificationService
async function testVerificationServiceInit() {
  try {
    console.log("📦 Testando import do VerificationService...");

    // Importar o VerificationService
    const {
      verificationService,
    } = require("../lib/services/verification-service");

    console.log("✅ Import do VerificationService - OK");

    console.log("🔧 Testando inicialização do VerificationService...");

    // Tentar inicializar o VerificationService
    await verificationService.initialize();

    console.log("✅ Inicialização do VerificationService - OK");

    return true;
  } catch (error) {
    console.log(
      `❌ Erro na inicialização do VerificationService: ${error.message}`
    );
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste de inicialização...\n");

  // Testar DatabaseClient
  const dbClientOk = await testDatabaseClientInit();

  console.log("");

  // Testar VerificationService
  const verificationOk = await testVerificationServiceInit();

  // Resultado final
  console.log("\n🎯 RESULTADO FINAL:");
  console.log(`✅ DatabaseClient: ${dbClientOk ? "OK" : "FALHOU"}`);
  console.log(`✅ VerificationService: ${verificationOk ? "OK" : "FALHOU"}`);

  if (dbClientOk && verificationOk) {
    console.log(
      "\n🎉 Todos os testes passaram! A inicialização está funcionando."
    );
  } else {
    console.log(
      "\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes."
    );
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDatabaseClientInit, testVerificationServiceInit };

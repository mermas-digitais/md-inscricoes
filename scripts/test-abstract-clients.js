#!/usr/bin/env node

/**
 * Script de Teste dos Clientes Abstratos
 *
 * Este script demonstra como usar o novo sistema de clientes abstratos
 */

require("dotenv").config();

const { getDatabaseClient } = require("../lib/clients/database-client");
const { apiClient } = require("../lib/clients/http-client");
const { inscricoesService } = require("../lib/services/inscricoes-service");
const { verificationService } = require("../lib/services/verification-service");
const { escolasService } = require("../lib/services/escolas-service");

async function testAbstractClients() {
  console.log("🧪 Testando Clientes Abstratos\n");

  try {
    // 1. Testar cliente de banco de dados
    console.log("📊 Testando Cliente de Banco de Dados:");
    const dbClient = await getDatabaseClient();
    console.log(`   Provedor: ${dbClient.getProvider()}`);

    const connectionTest = await dbClient.testConnection();
    console.log(`   Conexão: ${connectionTest ? "✅ OK" : "❌ Erro"}`);
    console.log("");

    // 2. Testar serviço de inscrições
    console.log("📝 Testando Serviço de Inscrições:");
    const inscricoesResult = await inscricoesService.findInscricoes({
      limit: 5,
    });
    if (inscricoesResult.success) {
      console.log(
        `   ✅ ${inscricoesResult.data.data.length} inscrições encontradas`
      );
      console.log(`   Provedor: ${inscricoesResult.provider}`);
    } else {
      console.log(`   ❌ Erro: ${inscricoesResult.error}`);
    }
    console.log("");

    // 3. Testar serviço de escolas
    console.log("🏫 Testando Serviço de Escolas:");
    const escolasResult = await escolasService.findEscolas({ limit: 3 });
    if (escolasResult.success) {
      console.log(`   ✅ ${escolasResult.data.length} escolas encontradas`);
      console.log(`   Provedor: ${escolasResult.provider}`);
      escolasResult.data.forEach((escola) => {
        console.log(`     - ${escola.nome} (${escola.tipo})`);
      });
    } else {
      console.log(`   ❌ Erro: ${escolasResult.error}`);
    }
    console.log("");

    // 4. Testar cliente HTTP
    console.log("🌐 Testando Cliente HTTP:");
    const statusResult = await apiClient.getDatabaseStatus();
    if (statusResult.success) {
      console.log(`   ✅ Status do banco obtido`);
      console.log(
        `   Provedor ativo: ${statusResult.data.data.activeProvider}`
      );
    } else {
      console.log(`   ❌ Erro: ${statusResult.error}`);
    }
    console.log("");

    // 5. Testar verificação de CPF
    console.log("🔍 Testando Verificação de CPF:");
    const cpfResult = await inscricoesService.checkCPFExists(
      "123.456.789-00",
      false
    );
    if (cpfResult.error) {
      console.log(`   ❌ Erro: ${cpfResult.error}`);
    } else {
      console.log(
        `   ✅ CPF verificado: ${cpfResult.exists ? "Existe" : "Não existe"}`
      );
    }
    console.log("");

    // 6. Resumo final
    console.log("📈 Resumo do Teste:");
    console.log(`   ✅ Cliente de banco: ${connectionTest ? "OK" : "ERRO"}`);
    console.log(
      `   ✅ Serviço de inscrições: ${inscricoesResult.success ? "OK" : "ERRO"}`
    );
    console.log(
      `   ✅ Serviço de escolas: ${escolasResult.success ? "OK" : "ERRO"}`
    );
    console.log(`   ✅ Cliente HTTP: ${statusResult.success ? "OK" : "ERRO"}`);
    console.log(
      `   ✅ Verificação de CPF: ${!cpfResult.error ? "OK" : "ERRO"}`
    );
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  }
}

// Executar teste
testAbstractClients()
  .then(() => {
    console.log("\n🎉 Teste dos clientes abstratos concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Teste falhou:", error);
    process.exit(1);
  });

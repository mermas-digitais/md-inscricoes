#!/usr/bin/env node

/**
 * Script para testar o VerificationService diretamente
 */

// Carregar variáveis de ambiente
require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testando VerificationService diretamente...\n");

// Função para verificar variáveis de ambiente
function checkEnvironmentVariables() {
  console.log("🌍 Verificando variáveis de ambiente...\n");

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  let allOk = true;

  // Verificar variáveis obrigatórias
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} - OK`);
    } else {
      console.log(`❌ ${varName} - FALTANDO`);
      allOk = false;
    }
  }

  console.log("");
  return allOk;
}

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
  console.log("🔗 Testando conexão com Supabase...\n");

  try {
    const { createClient } = require("@supabase/supabase-js");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Testar conexão fazendo uma query simples
    const { data, error } = await supabase
      .from("verification_codes")
      .select("id")
      .limit(1);

    if (error) {
      console.log(`❌ Erro na conexão Supabase: ${error.message}`);
      return false;
    }

    console.log(`✅ Conexão Supabase - OK`);
    return true;
  } catch (error) {
    console.log(`❌ Erro na conexão Supabase: ${error.message}`);
    return false;
  }
}

// Função para testar se o arquivo pode ser importado
function testImport(filePath) {
  try {
    console.log(`📦 Testando import: ${filePath}`);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      return false;
    }

    // Tentar compilar o arquivo
    const result = execSync(`npx tsc --noEmit --skipLibCheck ${filePath}`, {
      encoding: "utf8",
      stdio: "pipe",
    });

    console.log(`✅ ${filePath} - OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} - ERRO:`);
    console.log(`   ${error.message}`);
    return false;
  }
}

// Função para verificar arquivos de configuração
function checkConfigFiles() {
  console.log("📋 Verificando arquivos de configuração...\n");

  const configFiles = [
    "lib/database-config.ts",
    "lib/database-manager.ts",
    "lib/clients/database-client.ts",
    "lib/clients/http-client.ts",
    "lib/services/verification-service.ts",
  ];

  let allOk = true;

  for (const file of configFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!testImport(fullPath)) {
      allOk = false;
    }
  }

  console.log("");
  return allOk;
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste direto do VerificationService...\n");

  // Verificar variáveis de ambiente
  const envOk = checkEnvironmentVariables();

  if (!envOk) {
    console.log("❌ Variáveis de ambiente não configuradas. Abortando teste.");
    return;
  }

  // Testar conexão com Supabase
  const supabaseOk = await testSupabaseConnection();

  // Verificar arquivos de configuração
  const configOk = checkConfigFiles();

  // Resultado final
  console.log("🎯 RESULTADO FINAL:");
  console.log(`✅ Ambiente: ${envOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Supabase: ${supabaseOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Configuração: ${configOk ? "OK" : "FALHOU"}`);

  if (envOk && supabaseOk && configOk) {
    console.log(
      "\n🎉 Todos os testes passaram! O VerificationService deve estar funcionando."
    );
  } else {
    console.log(
      "\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes."
    );
  }

  console.log("\n💡 Para testar completamente, certifique-se de que:");
  console.log("   1. O servidor Next.js está rodando (yarn dev)");
  console.log("   2. As variáveis de ambiente estão configuradas");
  console.log("   3. O banco de dados está acessível");
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testImport,
  checkEnvironmentVariables,
  testSupabaseConnection,
  checkConfigFiles,
};

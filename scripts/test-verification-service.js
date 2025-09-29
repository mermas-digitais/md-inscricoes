#!/usr/bin/env node

/**
 * Script para testar o VerificationService
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testando VerificationService...\n");

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
    const result = execSync(`npx tsc --noEmit ${filePath}`, {
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

// Função para verificar dependências
function checkDependencies() {
  console.log("🔍 Verificando dependências...\n");

  const dependencies = [
    "@prisma/client",
    "@supabase/supabase-js",
    "nodemailer",
  ];

  let allOk = true;

  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} - OK`);
    } catch (error) {
      console.log(`❌ ${dep} - FALTANDO`);
      allOk = false;
    }
  }

  console.log("");
  return allOk;
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

// Função para verificar variáveis de ambiente
function checkEnvironmentVariables() {
  console.log("🌍 Verificando variáveis de ambiente...\n");

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const optionalVars = ["DATABASE_URL", "DATABASE_MODE", "DATABASE_FALLBACK"];

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

  // Verificar variáveis opcionais
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} - OK`);
    } else {
      console.log(`⚠️  ${varName} - NÃO CONFIGURADO (opcional)`);
    }
  }

  console.log("");
  return allOk;
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste do VerificationService...\n");

  // Verificar dependências
  const depsOk = checkDependencies();

  // Verificar arquivos de configuração
  const configOk = checkConfigFiles();

  // Verificar variáveis de ambiente
  const envOk = checkEnvironmentVariables();

  // Resultado final
  console.log("🎯 RESULTADO FINAL:");
  console.log(`✅ Dependências: ${depsOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Configuração: ${configOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Ambiente: ${envOk ? "OK" : "FALHOU"}`);

  if (depsOk && configOk && envOk) {
    console.log(
      "\n🎉 Todos os testes passaram! O VerificationService deve estar funcionando."
    );
  } else {
    console.log(
      "\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes."
    );
  }

  console.log("\n💡 Para testar completamente, certifique-se de que:");
  console.log("   1. O servidor Next.js está rodando (npm run dev)");
  console.log("   2. As variáveis de ambiente estão configuradas");
  console.log("   3. O banco de dados está acessível");
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testImport,
  checkDependencies,
  checkConfigFiles,
  checkEnvironmentVariables,
};

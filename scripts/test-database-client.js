#!/usr/bin/env node

/**
 * Script para testar o DatabaseClient diretamente
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testando DatabaseClient...\n");

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

// Função para verificar se o Prisma foi gerado
function checkPrismaGenerated() {
  console.log("🔍 Verificando se o Prisma foi gerado...\n");

  const prismaPath = path.join(process.cwd(), "lib", "generated", "prisma");

  if (fs.existsSync(prismaPath)) {
    console.log(`✅ Prisma gerado em: ${prismaPath}`);

    // Verificar arquivos importantes
    const importantFiles = [
      "index.js",
      "index.d.ts",
      "client.js",
      "client.d.ts",
    ];

    for (const file of importantFiles) {
      const filePath = path.join(prismaPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} - OK`);
      } else {
        console.log(`❌ ${file} - FALTANDO`);
        return false;
      }
    }

    return true;
  } else {
    console.log(`❌ Prisma não foi gerado em: ${prismaPath}`);
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
    "lib/services/inscricoes-service.ts",
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
  console.log("🚀 Iniciando teste do DatabaseClient...\n");

  // Verificar se o Prisma foi gerado
  const prismaOk = checkPrismaGenerated();

  // Verificar arquivos de configuração
  const configOk = checkConfigFiles();

  // Verificar variáveis de ambiente
  const envOk = checkEnvironmentVariables();

  // Resultado final
  console.log("🎯 RESULTADO FINAL:");
  console.log(`✅ Prisma: ${prismaOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Configuração: ${configOk ? "OK" : "FALHOU"}`);
  console.log(`✅ Ambiente: ${envOk ? "OK" : "FALHOU"}`);

  if (prismaOk && configOk && envOk) {
    console.log(
      "\n🎉 Todos os testes passaram! O DatabaseClient deve estar funcionando."
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
  checkPrismaGenerated,
  checkConfigFiles,
  checkEnvironmentVariables,
};

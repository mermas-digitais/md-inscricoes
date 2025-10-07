#!/usr/bin/env node

/**
 * Script para testar a estrutura final da API
 *
 * Este script verifica se todas as rotas estão funcionando
 * com a nova estrutura de banco de dados abstrato
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testando estrutura final da API...\n");

// Lista de rotas principais para testar
const mainRoutes = [
  {
    name: "Inscrição Principal",
    path: "/api/inscricao",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      nome: "Teste Usuário",
      cpf: "123.456.789-00",
      data_nascimento: "2000-01-01",
      cep: "65900-000",
      logradouro: "Rua Teste",
      numero: "123",
      complemento: "Apto 1",
      bairro: "Centro",
      cidade: "Imperatriz",
      estado: "MA",
      nome_responsavel: "Responsável Teste",
      telefone_whatsapp: "(99) 99999-9999",
      escolaridade: "Ensino Fundamental 2",
      ano_escolar: "9º ano",
      escola: "Escola Teste",
    },
  },
  {
    name: "Verificar CPF Principal",
    path: "/api/check-cpf",
    method: "POST",
    testData: {
      cpf: "123.456.789-00",
    },
  },
  {
    name: "Enviar Verificação Principal",
    path: "/api/send-verification",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
    },
  },
  {
    name: "Verificar Código Principal",
    path: "/api/verify-code",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      code: "123456",
    },
  },
  {
    name: "Buscar Escolas Principal",
    path: "/api/escolas?search=teste&limit=10",
    method: "GET",
  },
  {
    name: "Buscar Escolas Prisma",
    path: "/api/escolas-prisma?search=teste&limit=10",
    method: "GET",
  },
  {
    name: "Enviar Confirmação",
    path: "/api/send-confirmation",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      nomeCompleto: "Teste Usuário",
      nomeCurso: "Robótica",
      cpf: "123.456.789-00",
    },
  },
  {
    name: "Enviar Excedente",
    path: "/api/send-excedente",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      nomeCompleto: "Teste Usuário",
      nomeCurso: "Robótica",
      cpf: "123.456.789-00",
    },
  },
  {
    name: "Status do Banco",
    path: "/api/database-status",
    method: "GET",
  },
  {
    name: "Sincronização Bidirecional",
    path: "/api/sync/bidirectional",
    method: "POST",
    testData: {},
  },
];

// Rotas MDX25
const mdx25Routes = [
  {
    name: "MDX25 Inscrição",
    path: "/api/mdx25/inscricao",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      nome: "Teste Usuário",
      cpf: "123.456.789-00",
      data_nascimento: "2000-01-01",
      cep: "65900-000",
      logradouro: "Rua Teste",
      numero: "123",
      complemento: "Apto 1",
      bairro: "Centro",
      cidade: "Imperatriz",
      estado: "MA",
      nome_responsavel: "Responsável Teste",
      telefone_whatsapp: "(99) 99999-9999",
      escolaridade: "Ensino Fundamental 2",
      ano_escolar: "9º ano",
      escola: "Escola Teste",
    },
  },
  {
    name: "MDX25 Verificar CPF",
    path: "/api/mdx25/check-cpf",
    method: "POST",
    testData: {
      cpf: "123.456.789-00",
    },
  },
  {
    name: "MDX25 Enviar Verificação",
    path: "/api/mdx25/send-verification",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
    },
  },
  {
    name: "MDX25 Verificar Código",
    path: "/api/mdx25/verify-code",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      code: "123456",
    },
  },
  {
    name: "MDX25 Escolas",
    path: "/api/mdx25/escolas?search=teste&limit=10",
    method: "GET",
  },
];

// Função para fazer requisição HTTP
async function makeRequest(route) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}${route.path}`;

  const options = {
    method: route.method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (route.testData) {
    options.body = JSON.stringify(route.testData);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Função para testar uma rota
async function testRoute(route) {
  console.log(`📡 Testando ${route.name} (${route.method} ${route.path})...`);

  const result = await makeRequest(route);

  if (result.success) {
    console.log(`✅ ${route.name}: OK (Status: ${result.status})`);
    if (result.data && typeof result.data === "object") {
      console.log(
        `   Resposta: ${JSON.stringify(result.data).substring(0, 100)}...`
      );
    }
  } else {
    console.log(`❌ ${route.name}: FALHOU`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    } else {
      console.log(`   Status: ${result.status}`);
      console.log(
        `   Resposta: ${JSON.stringify(result.data).substring(0, 200)}...`
      );
    }
  }

  console.log("");
  return result.success;
}

// Função para verificar estrutura de arquivos
function checkFileStructure() {
  console.log("📁 Verificando estrutura de arquivos...\n");

  const apiDir = path.join(process.cwd(), "app", "api");
  const expectedRoutes = [
    "inscricao/route.ts",
    "check-cpf/route.ts",
    "send-verification/route.ts",
    "verify-code/route.ts",
    "escolas/route.ts",
    "escolas-prisma/route.ts",
    "send-confirmation/route.ts",
    "send-excedente/route.ts",
    "database-status/route.ts",
    "sync/bidirectional/route.ts",
    "mdx25/inscricao/route.ts",
    "mdx25/check-cpf/route.ts",
    "mdx25/send-verification/route.ts",
    "mdx25/verify-code/route.ts",
    "mdx25/escolas/route.ts",
  ];

  const removedRoutes = [
    "check-cpf-flexible",
    "check-cpf-updated",
    "inscricao-flexible",
    "inscricao-updated",
    "escolas-updated",
    "send-verification-updated",
    "verify-code-updated",
    "sync/from-supabase",
    "sync/to-supabase",
    "sync/full-database",
    "sync/single-table",
    "matriculas/create-inscricao",
    "matriculas/send-verification",
  ];

  let structureOk = true;

  // Verificar se as rotas esperadas existem
  for (const route of expectedRoutes) {
    const routePath = path.join(apiDir, route);
    if (fs.existsSync(routePath)) {
      console.log(`✅ ${route} - OK`);
    } else {
      console.log(`❌ ${route} - FALTANDO`);
      structureOk = false;
    }
  }

  console.log("");

  // Verificar se as rotas removidas foram realmente removidas
  for (const route of removedRoutes) {
    const routePath = path.join(apiDir, route);
    if (!fs.existsSync(routePath)) {
      console.log(`✅ ${route} - REMOVIDO`);
    } else {
      console.log(`❌ ${route} - AINDA EXISTE`);
      structureOk = false;
    }
  }

  console.log("");
  return structureOk;
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste da estrutura final da API...\n");

  // Verificar estrutura de arquivos
  const structureOk = checkFileStructure();

  if (!structureOk) {
    console.log("❌ Estrutura de arquivos incorreta!");
    return;
  }

  console.log("✅ Estrutura de arquivos OK!\n");

  // Testar rotas principais
  console.log("🧪 Testando rotas principais...\n");
  let successCount = 0;
  let totalCount = mainRoutes.length;

  for (const route of mainRoutes) {
    const success = await testRoute(route);
    if (success) successCount++;
  }

  console.log("📊 Resultados das Rotas Principais:");
  console.log(`✅ Sucessos: ${successCount}/${totalCount}`);
  console.log(`❌ Falhas: ${totalCount - successCount}/${totalCount}\n`);

  // Testar rotas MDX25
  console.log("🧪 Testando rotas MDX25...\n");
  let mdx25SuccessCount = 0;
  let mdx25TotalCount = mdx25Routes.length;

  for (const route of mdx25Routes) {
    const success = await testRoute(route);
    if (success) mdx25SuccessCount++;
  }

  console.log("📊 Resultados das Rotas MDX25:");
  console.log(`✅ Sucessos: ${mdx25SuccessCount}/${mdx25TotalCount}`);
  console.log(
    `❌ Falhas: ${mdx25TotalCount - mdx25SuccessCount}/${mdx25TotalCount}\n`
  );

  // Resultado final
  const totalSuccess = successCount + mdx25SuccessCount;
  const totalRoutes = totalCount + mdx25TotalCount;

  console.log("🎯 RESULTADO FINAL:");
  console.log(`✅ Total de Sucessos: ${totalSuccess}/${totalRoutes}`);
  console.log(
    `❌ Total de Falhas: ${totalRoutes - totalSuccess}/${totalRoutes}`
  );

  if (totalSuccess === totalRoutes) {
    console.log(
      "\n🎉 Todos os testes passaram! A estrutura final da API está funcionando corretamente."
    );
  } else {
    console.log(
      "\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes."
    );
  }

  console.log(
    "\n💡 Nota: Alguns testes podem falhar se o servidor não estiver rodando ou se houver problemas de configuração."
  );
  console.log("   Para testar completamente, certifique-se de que:");
  console.log("   1. O servidor Next.js está rodando (npm run dev)");
  console.log("   2. As variáveis de ambiente estão configuradas");
  console.log("   3. O banco de dados está acessível");
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRoute, makeRequest, mainRoutes, mdx25Routes };

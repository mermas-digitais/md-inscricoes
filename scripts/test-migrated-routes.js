#!/usr/bin/env node

/**
 * Script para testar as rotas migradas
 *
 * Este script testa todas as rotas que foram migradas para usar
 * a nova estrutura de serviços abstratos
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🧪 Testando rotas migradas...\n");

// Lista de rotas migradas para testar
const routesToTest = [
  {
    name: "Inscrição",
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
    name: "Verificar CPF",
    path: "/api/check-cpf",
    method: "POST",
    testData: {
      cpf: "123.456.789-00",
    },
  },
  {
    name: "Enviar Verificação",
    path: "/api/send-verification",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
    },
  },
  {
    name: "Verificar Código",
    path: "/api/verify-code",
    method: "POST",
    testData: {
      email: "teste@exemplo.com",
      code: "123456",
    },
  },
  {
    name: "Buscar Escolas",
    path: "/api/escolas?search=teste&limit=10",
    method: "GET",
  },
  {
    name: "Buscar Escolas (Prisma)",
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

// Função principal
async function main() {
  console.log("🚀 Iniciando testes das rotas migradas...\n");

  let successCount = 0;
  let totalCount = routesToTest.length;

  for (const route of routesToTest) {
    const success = await testRoute(route);
    if (success) successCount++;
  }

  console.log("📊 Resultados dos Testes:");
  console.log(`✅ Sucessos: ${successCount}/${totalCount}`);
  console.log(`❌ Falhas: ${totalCount - successCount}/${totalCount}`);

  if (successCount === totalCount) {
    console.log(
      "\n🎉 Todos os testes passaram! As rotas migradas estão funcionando corretamente."
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

module.exports = { testRoute, makeRequest, routesToTest };

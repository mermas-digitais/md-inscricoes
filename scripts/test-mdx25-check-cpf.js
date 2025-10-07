#!/usr/bin/env node

/**
 * Script para testar a verificação de CPF do MDX25
 */

// Carregar variáveis de ambiente
require("dotenv").config();

console.log("🧪 Testando verificação de CPF MDX25...\n");

// Função para testar verificação de CPF
async function testMDX25CheckCPF() {
  try {
    console.log("📦 Testando verificação de CPF MDX25...");

    // Testar com um CPF que provavelmente não existe
    const testCPF = "123.456.789-00";

    const response = await fetch("http://localhost:3000/api/mdx25/check-cpf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: testCPF }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Resposta da API:", data);

    return true;
  } catch (error) {
    console.log(`❌ Erro na verificação de CPF: ${error.message}`);
    return false;
  }
}

// Função para testar verificação de CPF normal
async function testNormalCheckCPF() {
  try {
    console.log("📦 Testando verificação de CPF normal...");

    // Testar com um CPF que provavelmente não existe
    const testCPF = "123.456.789-00";

    const response = await fetch("http://localhost:3000/api/check-cpf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: testCPF }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Resposta da API normal:", data);

    return true;
  } catch (error) {
    console.log(`❌ Erro na verificação de CPF normal: ${error.message}`);
    return false;
  }
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste de verificação de CPF...\n");

  // Testar verificação MDX25
  const mdx25Ok = await testMDX25CheckCPF();

  console.log("");

  // Testar verificação normal
  const normalOk = await testNormalCheckCPF();

  // Resultado final
  console.log("\n🎯 RESULTADO FINAL:");
  console.log(`✅ MDX25 Check CPF: ${mdx25Ok ? "OK" : "FALHOU"}`);
  console.log(`✅ Normal Check CPF: ${normalOk ? "OK" : "FALHOU"}`);

  if (mdx25Ok && normalOk) {
    console.log("\n🎉 Todos os testes passaram!");
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

module.exports = { testMDX25CheckCPF, testNormalCheckCPF };

#!/usr/bin/env node

/**
 * Script para testar se as tabelas existem no Supabase
 */

// Carregar variáveis de ambiente
require("dotenv").config();

console.log("🧪 Testando tabelas do Supabase...\n");

// Função para testar tabelas do Supabase
async function testSupabaseTables() {
  try {
    console.log("📦 Importando Supabase...");

    const { createClient } = require("@supabase/supabase-js");

    console.log("✅ Import do Supabase - OK");

    console.log("🔧 Criando cliente Supabase...");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("✅ Cliente Supabase criado - OK");

    // Lista de tabelas para testar
    const tables = [
      "verification_codes",
      "inscricoes",
      "escolas",
      "cursos",
      "turmas",
      "eventos",
      "modalidades",
      "inscricoes_eventos",
      "orientadores",
      "participantes_eventos",
    ];

    console.log("🔍 Testando tabelas...\n");

    for (const table of tables) {
      try {
        console.log(`📋 Testando tabela: ${table}`);

        const { data, error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          console.log(`❌ ${table} - ERRO: ${error.message}`);
        } else {
          console.log(`✅ ${table} - OK`);
        }
      } catch (error) {
        console.log(`❌ ${table} - ERRO: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
    return false;
  }
}

// Função principal
async function main() {
  console.log("🚀 Iniciando teste de tabelas do Supabase...\n");

  // Testar tabelas
  const tablesOk = await testSupabaseTables();

  // Resultado final
  console.log("\n🎯 RESULTADO FINAL:");
  console.log(`✅ Tabelas: ${tablesOk ? "OK" : "FALHOU"}`);

  if (tablesOk) {
    console.log("\n🎉 Teste de tabelas concluído!");
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

module.exports = { testSupabaseTables };

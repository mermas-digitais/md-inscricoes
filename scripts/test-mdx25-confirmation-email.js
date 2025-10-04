/**
 * Script de Teste para Envio de Email de Confirmação MDX25
 *
 * Este script testa o endpoint de confirmação de email sem precisar
 * preencher todo o formulário de inscrição.
 *
 * Como usar:
 * 1. Certifique-se de que o servidor está rodando (npm run dev)
 * 2. Execute: node scripts/test-mdx25-confirmation-email.js
 * 3. Verifique os logs no console do servidor
 */

const https = require("https");
const http = require("http");

// Configurações do teste
const TEST_CONFIG = {
  // URL do endpoint (ajuste conforme necessário)
  url: "http://localhost:3000/api/mdx25/send-confirmation",

  // Dados de teste
  testData: {
    email: "teste@exemplo.com", // Altere para seu email de teste
    nomeCompleto: "Maria da Silva Santos",
    nomeCurso: "Desenvolvimento Web Full Stack",
    cpf: "123.456.789-00",
  },

  // Configurações de timeout
  timeout: 30000, // 30 segundos
};

/**
 * Função para fazer requisição HTTP
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: TEST_CONFIG.timeout,
    };

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonResponse,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Função principal de teste
 */
async function testConfirmationEmail() {
  console.log("🚀 Iniciando teste de envio de email de confirmação MDX25...\n");

  console.log("📋 Dados de teste:");
  console.log(`   Email: ${TEST_CONFIG.testData.email}`);
  console.log(`   Nome: ${TEST_CONFIG.testData.nomeCompleto}`);
  console.log(`   Curso: ${TEST_CONFIG.testData.nomeCurso}`);
  console.log(`   CPF: ${TEST_CONFIG.testData.cpf}`);
  console.log(`   URL: ${TEST_CONFIG.url}\n`);

  try {
    console.log("📤 Enviando requisição...");
    const startTime = Date.now();

    const response = await makeRequest(TEST_CONFIG.url, TEST_CONFIG.testData);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Resposta recebida em ${duration}ms`);
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log("📄 Resposta:", JSON.stringify(response.data, null, 2));

    if (response.statusCode === 200 && response.data.success) {
      console.log("\n🎉 SUCESSO! Email de confirmação enviado com sucesso!");
      console.log(
        "📧 Verifique sua caixa de entrada (e spam) para o email de confirmação."
      );
    } else {
      console.log("\n❌ FALHA! O envio do email falhou.");
      if (response.data.error) {
        console.log(`🔍 Erro: ${response.data.error}`);
      }
    }
  } catch (error) {
    console.error("\n💥 ERRO durante o teste:");
    console.error(`   Tipo: ${error.name || "Unknown"}`);
    console.error(`   Mensagem: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "\n💡 Dica: Certifique-se de que o servidor está rodando (npm run dev)"
      );
    } else if (error.message === "Request timeout") {
      console.log(
        "\n💡 Dica: O servidor pode estar demorando para responder. Verifique os logs."
      );
    }
  }
}

/**
 * Função para testar com diferentes dados
 */
async function testWithDifferentData() {
  console.log("\n🔄 Testando com dados alternativos...\n");

  const alternativeData = {
    email: "outro@teste.com",
    nomeCompleto: "Ana Carolina Oliveira",
    nomeCurso: "Data Science e Machine Learning",
    cpf: "987.654.321-00",
  };

  try {
    const response = await makeRequest(TEST_CONFIG.url, alternativeData);
    console.log(`📊 Status: ${response.statusCode}`);
    console.log("📄 Resposta:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Erro no teste alternativo:", error.message);
  }
}

/**
 * Função para testar validação de campos obrigatórios
 */
async function testValidation() {
  console.log("\n🔍 Testando validação de campos obrigatórios...\n");

  const invalidData = {
    email: "teste@exemplo.com",
    // nomeCompleto: omitido propositalmente
    nomeCurso: "Desenvolvimento Web",
    cpf: "123.456.789-00",
  };

  try {
    const response = await makeRequest(TEST_CONFIG.url, invalidData);
    console.log(`📊 Status: ${response.statusCode}`);
    console.log("📄 Resposta:", JSON.stringify(response.data, null, 2));

    if (response.statusCode === 400) {
      console.log("✅ Validação funcionando corretamente!");
    } else {
      console.log("⚠️  Validação pode não estar funcionando como esperado.");
    }
  } catch (error) {
    console.error("❌ Erro no teste de validação:", error.message);
  }
}

// Executar os testes
async function runAllTests() {
  console.log("🧪 ===== TESTE DE EMAIL DE CONFIRMAÇÃO MDX25 =====\n");

  // Teste principal
  await testConfirmationEmail();

  // Aguardar um pouco entre os testes
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Teste de validação
  await testValidation();

  // Aguardar um pouco entre os testes
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Teste com dados alternativos
  await testWithDifferentData();

  console.log("\n🏁 Testes concluídos!");
  console.log("\n💡 Dicas:");
  console.log("   - Verifique os logs do servidor para mais detalhes");
  console.log(
    "   - Confirme se as variáveis de ambiente SMTP estão configuradas"
  );
  console.log("   - Teste com um email real para verificar se o email chega");
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testConfirmationEmail,
  testWithDifferentData,
  testValidation,
  makeRequest,
};

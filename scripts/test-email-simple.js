#!/usr/bin/env node

/**
 * Script Simples de Teste para Email de Confirmação MDX25
 *
 * Uso: node scripts/test-email-simple.js [email]
 * Exemplo: node scripts/test-email-simple.js meuemail@teste.com
 */

const http = require("http");

// Configurações
const PORT = 3000;
const HOST = "localhost";
const PATH = "/api/mdx25/send-confirmation";

// Dados de teste padrão
const defaultTestData = {
  email: "teste@exemplo.com",
  nomeCompleto: "Maria da Silva Santos",
  nomeCurso: "Desenvolvimento Web Full Stack",
  cpf: "123.456.789-00",
};

// Obter email dos argumentos da linha de comando
const args = process.argv.slice(2);
const testEmail = args[0] || defaultTestData.email;

const testData = {
  ...defaultTestData,
  email: testEmail,
};

console.log("🧪 Teste de Email de Confirmação MDX25");
console.log("=====================================");
console.log(`📧 Email: ${testData.email}`);
console.log(`👤 Nome: ${testData.nomeCompleto}`);
console.log(`📚 Curso: ${testData.nomeCurso}`);
console.log(`🆔 CPF: ${testData.cpf}`);
console.log("");

// Fazer requisição
const postData = JSON.stringify(testData);

const options = {
  hostname: HOST,
  port: PORT,
  path: PATH,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

console.log("📤 Enviando requisição...");

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`📊 Status: ${res.statusCode}`);

    try {
      const response = JSON.parse(data);
      console.log("📄 Resposta:", JSON.stringify(response, null, 2));

      if (res.statusCode === 200 && response.success) {
        console.log("");
        console.log("🎉 SUCESSO! Email enviado!");
        console.log("📧 Verifique sua caixa de entrada.");
      } else {
        console.log("");
        console.log("❌ FALHA! Verifique os logs do servidor.");
      }
    } catch (error) {
      console.log("📄 Resposta (texto):", data);
    }
  });
});

req.on("error", (error) => {
  console.error("💥 Erro:", error.message);

  if (error.code === "ECONNREFUSED") {
    console.log("");
    console.log("💡 Dica: Certifique-se de que o servidor está rodando:");
    console.log("   npm run dev");
  }
});

req.write(postData);
req.end();


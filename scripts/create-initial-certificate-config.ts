/**
 * Script para criar configuração inicial de certificado
 * Execute este script após fazer upload do template de certificado
 */

import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function createInitialCertificateConfig() {
  try {
    console.log("Criando configuração inicial de certificado...");

    // Configuração padrão - ajuste conforme seu template
    const config = {
      edicao: "2024.2",
      templateUrl: "/assets/certificados/template_default.jpg", // Substitua pelo seu template
      ativo: true,
      posicoes: {
        nome: { x: 150, y: 180 }, // Ajuste conforme posição no template
        cpf: { x: 150, y: 220 }, // Ajuste conforme posição no template
        data: { x: 150, y: 260 }, // Ajuste conforme posição no template
        carga_horaria: { x: 150, y: 300 }, // Ajuste conforme posição no template
      },
      fontes: {
        nome: { size: 18, color: "#2D3748", family: "helvetica" },
        cpf: { size: 14, color: "#4A5568", family: "helvetica" },
        data: { size: 14, color: "#4A5568", family: "helvetica" },
        carga_horaria: { size: 14, color: "#4A5568", family: "helvetica" },
      },
    };

    // Verificar se já existe configuração ativa
    const existingConfig = await prisma.certificadosConfig.findFirst({
      where: { ativo: true },
    });

    if (existingConfig) {
      console.log("Já existe uma configuração ativa. Desativando...");
      await prisma.certificadosConfig.update({
        where: { id: existingConfig.id },
        data: { ativo: false },
      });
    }

    // Criar nova configuração
    const newConfig = await prisma.certificadosConfig.create({
      data: config,
    });

    console.log("✅ Configuração de certificado criada com sucesso!");
    console.log("ID:", newConfig.id);
    console.log("Edição:", newConfig.edicao);
    console.log("Template:", newConfig.templateUrl);
    console.log("\n📝 IMPORTANTE:");
    console.log(
      "1. Substitua o template padrão pelo seu arquivo de certificado"
    );
    console.log("2. Ajuste as posições (x, y) conforme seu template");
    console.log("3. Teste o envio com uma aluna antes de usar em massa");
  } catch (error) {
    console.error("❌ Erro ao criar configuração:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createInitialCertificateConfig();
}

export { createInitialCertificateConfig };

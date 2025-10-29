import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

export const runtime = "nodejs";

const prisma = new PrismaClient();

// GET - Listar configurações de certificados
export async function GET(request: NextRequest) {
  try {
    const configs = await prisma.certificadosConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações de certificados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova configuração de certificado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { edicao, templateUrl, posicoes, fontes } = body;

    // Validar dados obrigatórios
    if (!edicao || !templateUrl || !posicoes || !fontes) {
      return NextResponse.json(
        {
          error: "Edição, URL do template, posições e fontes são obrigatórios",
        },
        { status: 400 }
      );
    }

    // Desativar outras configurações se esta for marcada como ativa
    if (body.ativo) {
      await prisma.certificadosConfig.updateMany({
        where: { ativo: true },
        data: { ativo: false },
      });
    }

    // Criar nova configuração
    const config = await prisma.certificadosConfig.create({
      data: {
        edicao,
        templateUrl,
        ativo: body.ativo || false,
        posicoes,
        fontes,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
      message: "Configuração de certificado criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar configuração de certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configuração existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, edicao, templateUrl, posicoes, fontes, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID da configuração é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se configuração existe
    const existingConfig = await prisma.certificadosConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuração não encontrada" },
        { status: 404 }
      );
    }

    // Se estiver ativando esta configuração, desativar outras
    if (ativo && !existingConfig.ativo) {
      await prisma.certificadosConfig.updateMany({
        where: { ativo: true },
        data: { ativo: false },
      });
    }

    // Atualizar configuração
    const updatedConfig = await prisma.certificadosConfig.update({
      where: { id },
      data: {
        edicao: edicao || existingConfig.edicao,
        templateUrl: templateUrl || existingConfig.templateUrl,
        posicoes: posicoes || existingConfig.posicoes,
        fontes: fontes || existingConfig.fontes,
        ativo: ativo !== undefined ? ativo : existingConfig.ativo,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: "Configuração de certificado atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar configuração de certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar configuração
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da configuração é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se configuração existe
    const existingConfig = await prisma.certificadosConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuração não encontrada" },
        { status: 404 }
      );
    }

    // Não permitir deletar configuração ativa
    if (existingConfig.ativo) {
      return NextResponse.json(
        { error: "Não é possível deletar uma configuração ativa" },
        { status: 400 }
      );
    }

    // Deletar configuração
    await prisma.certificadosConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Configuração de certificado deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar configuração de certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

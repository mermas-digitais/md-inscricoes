/**
 * API de Status do Banco de Dados
 *
 * Fornece informações sobre o status dos bancos de dados
 * e permite alternar entre eles
 */

import { type NextRequest, NextResponse } from "next/server";
import { dbManager } from "@/lib/database-manager";
import { DATABASE_CONFIG } from "@/lib/database-config";

export async function GET(request: NextRequest) {
  try {
    const stats = await dbManager.getStats();
    const connectionTest = await dbManager.testConnection();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        connectionTest,
        config: {
          mode: DATABASE_CONFIG.mode,
          fallbackEnabled: DATABASE_CONFIG.fallback.enabled,
          fallbackPrimary: DATABASE_CONFIG.fallback.primary,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao obter status do banco:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "reconnect":
        await dbManager.reconnect();
        return NextResponse.json({
          success: true,
          message: "Reconexão realizada com sucesso",
        });

      case "test":
        const connectionTest = await dbManager.testConnection();
        return NextResponse.json({
          success: true,
          data: connectionTest,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Ação não reconhecida. Use: 'reconnect' ou 'test'",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erro na ação do banco:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * Utilitários de Banco de Dados para APIs
 *
 * Fornece funções de conveniência para APIs que precisam
 * alternar entre Prisma e Supabase de forma transparente
 */

import { NextRequest, NextResponse } from "next/server";
import { dbManager } from "./database-manager";
import { DatabaseProvider } from "./database-config";

/**
 * Resultado de operação de banco
 */
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: DatabaseProvider;
}

/**
 * Executa operação de banco com fallback automático
 */
export async function executeDatabaseOperation<T>(
  operation: (provider: DatabaseProvider) => Promise<T>,
  fallbackOperation?: (provider: DatabaseProvider) => Promise<T>
): Promise<DatabaseResult<T>> {
  try {
    const result = await dbManager.executeWithFallback(
      operation,
      fallbackOperation
    );
    const provider = await dbManager.getActiveProvider();

    return {
      success: true,
      data: result,
      provider,
    };
  } catch (error) {
    const provider = await dbManager.getActiveProvider();

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      provider,
    };
  }
}

/**
 * Wrapper para operações Prisma
 */
export async function executePrismaOperation<T>(
  operation: (prisma: any) => Promise<T>
): Promise<DatabaseResult<T>> {
  return executeDatabaseOperation(async (provider) => {
    if (provider !== "prisma") {
      throw new Error("Operação Prisma requer provider 'prisma'");
    }

    const prisma = dbManager.getPrisma();
    return await operation(prisma);
  });
}

/**
 * Wrapper para operações Supabase
 */
export async function executeSupabaseOperation<T>(
  operation: (supabase: any) => Promise<T>
): Promise<DatabaseResult<T>> {
  return executeDatabaseOperation(async (provider) => {
    if (provider !== "supabase") {
      throw new Error("Operação Supabase requer provider 'supabase'");
    }

    const supabase = dbManager.getSupabase();
    return await operation(supabase);
  });
}

/**
 * Operação híbrida que funciona com ambos os providers
 */
export async function executeHybridOperation<T>(
  prismaOperation: (prisma: any) => Promise<T>,
  supabaseOperation: (supabase: any) => Promise<T>
): Promise<DatabaseResult<T>> {
  return executeDatabaseOperation(
    async (provider) => {
      if (provider === "prisma") {
        const prisma = dbManager.getPrisma();
        return await prismaOperation(prisma);
      } else {
        const supabase = dbManager.getSupabase();
        return await supabaseOperation(supabase);
      }
    },
    async (provider) => {
      if (provider === "prisma") {
        const prisma = dbManager.getPrisma();
        return await prismaOperation(prisma);
      } else {
        const supabase = dbManager.getSupabase();
        return await supabaseOperation(supabase);
      }
    }
  );
}

/**
 * Cria resposta de erro padronizada
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  provider?: DatabaseProvider
): NextResponse {
  const response: any = { error };

  if (provider) {
    response.provider = provider;
  }

  return NextResponse.json(response, { status });
}

/**
 * Cria resposta de sucesso padronizada
 */
export function createSuccessResponse<T>(
  data: T,
  provider?: DatabaseProvider,
  status: number = 200
): NextResponse {
  const response: any = { success: true, data };

  if (provider) {
    response.provider = provider;
  }

  return NextResponse.json(response, { status });
}

/**
 * Middleware para APIs que precisam de banco de dados
 */
export function withDatabase<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Testa conexão antes de executar
      const connectionTest = await dbManager.testConnection();

      if (connectionTest.status === "error") {
        console.error("Erro de conexão com banco:", connectionTest.error);
        return createErrorResponse(
          "Erro de conexão com banco de dados",
          503,
          connectionTest.provider
        );
      }

      return await handler(request, ...args);
    } catch (error) {
      console.error("Erro na API:", error);
      return createErrorResponse(
        error instanceof Error ? error.message : "Erro interno do servidor",
        500
      );
    }
  };
}

/**
 * Utilitário para operações de inscrições
 */
export class InscricoesDatabase {
  /**
   * Busca inscrições com paginação
   */
  static async findMany(
    options: {
      page?: number;
      limit?: number;
      curso?: string;
      status?: string;
    } = {}
  ) {
    const { page = 1, limit = 20, curso, status } = options;
    const offset = (page - 1) * limit;

    return executeHybridOperation(
      // Prisma
      async (prisma) => {
        const where: any = {};
        if (curso) where.curso = curso;
        if (status) where.status = status;

        const [data, total] = await Promise.all([
          prisma.inscricoes.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit,
          }),
          prisma.inscricoes.count({ where }),
        ]);

        return {
          data,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        };
      },
      // Supabase
      async (supabase) => {
        let query = supabase
          .from("inscricoes")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (curso) query = query.eq("curso", curso);
        if (status) query = query.eq("status", status);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          data: data || [],
          pagination: {
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit),
            totalItems: count || 0,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil((count || 0) / limit),
            hasPrevPage: page > 1,
          },
        };
      }
    );
  }

  /**
   * Cria nova inscrição
   */
  static async create(data: any) {
    return executeHybridOperation(
      // Prisma
      async (prisma) => {
        return await prisma.inscricoes.create({
          data: {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      },
      // Supabase
      async (supabase) => {
        const { data: result, error } = await supabase
          .from("inscricoes")
          .insert([
            {
              ...data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    );
  }

  /**
   * Verifica se CPF já existe
   */
  static async checkCPFExists(cpf: string) {
    return executeHybridOperation(
      // Prisma
      async (prisma) => {
        const count = await prisma.inscricoes.count({
          where: { cpf },
        });
        return count > 0;
      },
      // Supabase
      async (supabase) => {
        const { data, error } = await supabase
          .from("inscricoes")
          .select("id")
          .eq("cpf", cpf)
          .limit(1);

        if (error) throw error;
        return data && data.length > 0;
      }
    );
  }
}

/**
 * Utilitário para operações de códigos de verificação
 */
export class VerificationCodesDatabase {
  /**
   * Cria código de verificação
   */
  static async create(data: { email: string; code: string; expiresAt: Date }) {
    return executeHybridOperation(
      // Prisma
      async (prisma) => {
        return await prisma.verificationCodes.create({
          data: {
            ...data,
            createdAt: new Date(),
          },
        });
      },
      // Supabase
      async (supabase) => {
        const { data: result, error } = await supabase
          .from("verification_codes")
          .insert([
            {
              email: data.email,
              code: data.code,
              expires_at: data.expiresAt.toISOString(),
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    );
  }

  /**
   * Verifica código de verificação
   */
  static async verifyCode(email: string, code: string) {
    return executeHybridOperation(
      // Prisma
      async (prisma) => {
        const verification = await prisma.verificationCodes.findFirst({
          where: {
            email,
            code,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (verification) {
          // Remove o código após verificação
          await prisma.verificationCodes.delete({
            where: { id: verification.id },
          });
        }

        return !!verification;
      },
      // Supabase
      async (supabase) => {
        const { data, error } = await supabase
          .from("verification_codes")
          .select("*")
          .eq("email", email)
          .eq("code", code)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return false;

        // Remove o código após verificação
        await supabase.from("verification_codes").delete().eq("id", data.id);

        return true;
      }
    );
  }
}

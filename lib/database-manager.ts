/**
 * Gerenciador de Conexões de Banco de Dados
 *
 * Centraliza o acesso aos bancos de dados (Prisma local e Supabase)
 * com fallback automático e cache de conexões
 */

import { PrismaClient } from "./generated/prisma";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getActiveDatabaseProvider,
  DATABASE_CONFIG,
  DatabaseProvider,
  logDatabaseConfig,
} from "./database-config";

// Cache global de conexões
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

/**
 * Classe para gerenciar conexões de banco
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private activeProvider: DatabaseProvider | null = null;
  private prisma: PrismaClient | null = null;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    // Log da configuração na inicialização
    logDatabaseConfig();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Obtém o provedor ativo
   */
  public async getActiveProvider(): Promise<DatabaseProvider> {
    if (!this.activeProvider) {
      this.activeProvider = await getActiveDatabaseProvider();
      console.log(`🗄️ Provedor de banco ativo: ${this.activeProvider}`);
    }
    return this.activeProvider;
  }

  /**
   * Obtém instância do Prisma
   */
  public getPrisma(): PrismaClient {
    if (!this.prisma) {
      this.prisma =
        globalForPrisma.prisma ??
        new PrismaClient({
          datasources: {
            db: {
              url: DATABASE_CONFIG.local.url,
            },
          },
        });

      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = this.prisma;
      }
    }
    return this.prisma;
  }

  /**
   * Obtém instância do Supabase
   */
  public getSupabase(): SupabaseClient {
    if (!this.supabase) {
      if (
        !DATABASE_CONFIG.supabase.url ||
        !DATABASE_CONFIG.supabase.serviceKey
      ) {
        throw new Error(
          "Supabase não configurado. Verifique as variáveis de ambiente."
        );
      }

      this.supabase =
        globalForSupabase.supabase ??
        createClient(
          DATABASE_CONFIG.supabase.url,
          DATABASE_CONFIG.supabase.serviceKey
        );

      if (process.env.NODE_ENV !== "production") {
        globalForSupabase.supabase = this.supabase;
      }
    }
    return this.supabase;
  }

  /**
   * Executa operação com fallback automático
   */
  public async executeWithFallback<T>(
    operation: (provider: DatabaseProvider) => Promise<T>,
    fallbackOperation?: (provider: DatabaseProvider) => Promise<T>
  ): Promise<T> {
    const primaryProvider = await this.getActiveProvider();

    try {
      console.log(`🔄 Executando operação com ${primaryProvider}`);
      return await operation(primaryProvider);
    } catch (error) {
      console.warn(`❌ Erro com ${primaryProvider}:`, error);

      if (DATABASE_CONFIG.fallback.enabled && fallbackOperation) {
        const fallbackProvider =
          primaryProvider === "prisma" ? "supabase" : "prisma";
        console.log(`🔄 Tentando fallback com ${fallbackProvider}`);

        try {
          return await fallbackOperation(fallbackProvider);
        } catch (fallbackError) {
          console.error(
            `❌ Erro no fallback com ${fallbackProvider}:`,
            fallbackError
          );
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * Testa conexão com o banco ativo
   */
  public async testConnection(): Promise<{
    provider: DatabaseProvider;
    status: "success" | "error";
    error?: string;
  }> {
    try {
      const provider = await this.getActiveProvider();

      if (provider === "prisma") {
        const prisma = this.getPrisma();
        await prisma.$connect();
        await prisma.$disconnect();
        return { provider, status: "success" };
      } else {
        const supabase = this.getSupabase();
        const { error } = await supabase
          .from("inscricoes")
          .select("id")
          .limit(1);
        if (error) throw error;
        return { provider, status: "success" };
      }
    } catch (error) {
      return {
        provider: await this.getActiveProvider(),
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Força reconexão (útil para mudanças de configuração)
   */
  public async reconnect(): Promise<void> {
    console.log("🔄 Reconectando bancos de dados...");

    // Limpa cache
    this.activeProvider = null;

    // Desconecta Prisma se existir
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    // Limpa Supabase
    this.supabase = null;

    // Limpa cache global
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = undefined;
      globalForSupabase.supabase = undefined;
    }

    console.log("✅ Reconexão concluída");
  }

  /**
   * Obtém estatísticas dos bancos
   */
  public async getStats(): Promise<{
    activeProvider: DatabaseProvider;
    prismaAvailable: boolean;
    supabaseAvailable: boolean;
    config: typeof DATABASE_CONFIG;
  }> {
    const activeProvider = await this.getActiveProvider();

    let prismaAvailable = false;
    let supabaseAvailable = false;

    try {
      const prisma = this.getPrisma();
      await prisma.$connect();
      await prisma.$disconnect();
      prismaAvailable = true;
    } catch (error) {
      prismaAvailable = false;
    }

    try {
      const supabase = this.getSupabase();
      const { error } = await supabase.from("inscricoes").select("id").limit(1);
      supabaseAvailable = !error;
    } catch (error) {
      supabaseAvailable = false;
    }

    return {
      activeProvider,
      prismaAvailable,
      supabaseAvailable,
      config: DATABASE_CONFIG,
    };
  }
}

// Instância singleton
export const dbManager = DatabaseManager.getInstance();

// Exporta funções de conveniência
export const getDatabase = () => dbManager;
export const getPrisma = () => dbManager.getPrisma();
export const getSupabase = () => dbManager.getSupabase();
export const getActiveProvider = () => dbManager.getActiveProvider();

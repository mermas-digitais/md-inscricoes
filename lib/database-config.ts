/**
 * Configuração Flexível de Banco de Dados
 *
 * Este arquivo permite alternar entre banco local (Docker) e nuvem (Supabase)
 * através da variável de ambiente DATABASE_MODE
 */

import { PrismaClient } from "./generated/prisma";
import { createClient } from "@supabase/supabase-js";

// Tipos para configuração
export type DatabaseMode = "local" | "supabase" | "auto";
export type DatabaseProvider = "prisma" | "supabase";

// Configuração do modo de banco
export const DATABASE_CONFIG = {
  // Modo do banco: "local" (Docker), "supabase" (nuvem), "auto" (detecta automaticamente)
  mode: (process.env.DATABASE_MODE as DatabaseMode) || "auto",

  // URLs de conexão
  local: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:mermas123@localhost:5432/mermas_digitais_db",
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Configurações de fallback
  fallback: {
    enabled: process.env.DATABASE_FALLBACK === "true",
    primary: (process.env.DATABASE_PRIMARY as DatabaseProvider) || "prisma",
  },
};

/**
 * Detecta automaticamente qual banco usar
 */
export function detectDatabaseMode(): DatabaseProvider {
  if (DATABASE_CONFIG.mode === "local") {
    return "prisma";
  }

  if (DATABASE_CONFIG.mode === "supabase") {
    return "supabase";
  }

  // Modo "auto" - detecta baseado na disponibilidade
  try {
    // Verifica se as variáveis do Supabase estão configuradas
    if (DATABASE_CONFIG.supabase.url && DATABASE_CONFIG.supabase.serviceKey) {
      return "supabase";
    }
  } catch (error) {
    console.warn("Supabase não configurado, tentando Prisma local");
  }

  // Fallback para Prisma local
  return "prisma";
}

/**
 * Verifica se o banco local está disponível
 */
export async function isLocalDatabaseAvailable(): Promise<boolean> {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_CONFIG.local.url,
        },
      },
    });
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.warn("Banco local não disponível:", error);
    return false;
  }
}

/**
 * Verifica se o Supabase está disponível
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    if (!DATABASE_CONFIG.supabase.url || !DATABASE_CONFIG.supabase.serviceKey) {
      return false;
    }

    const supabase = createClient(
      DATABASE_CONFIG.supabase.url,
      DATABASE_CONFIG.supabase.serviceKey
    );

    // Testa conexão fazendo uma query simples
    const { error } = await supabase.from("inscricoes").select("id").limit(1);
    return !error;
  } catch (error) {
    console.warn("Supabase não disponível:", error);
    return false;
  }
}

/**
 * Obtém o provedor de banco ativo
 */
export async function getActiveDatabaseProvider(): Promise<DatabaseProvider> {
  const detectedMode = detectDatabaseMode();

  // Se o modo é específico, usa ele
  if (DATABASE_CONFIG.mode !== "auto") {
    return detectedMode;
  }

  // Modo auto - verifica disponibilidade
  if (detectedMode === "supabase") {
    const isSupabaseReady = await isSupabaseAvailable();
    if (isSupabaseReady) {
      return "supabase";
    }
  }

  // Verifica se o banco local está disponível
  const isLocalReady = await isLocalDatabaseAvailable();
  if (isLocalReady) {
    return "prisma";
  }

  // Se nenhum está disponível, usa o primário configurado
  console.warn(
    "Nenhum banco disponível, usando fallback:",
    DATABASE_CONFIG.fallback.primary
  );
  return DATABASE_CONFIG.fallback.primary;
}

/**
 * Log da configuração atual
 */
export function logDatabaseConfig() {
  console.log("🔧 Configuração de Banco de Dados:");
  console.log(`   Modo: ${DATABASE_CONFIG.mode}`);
  console.log(
    `   Local URL: ${
      DATABASE_CONFIG.local.url ? "✅ Configurado" : "❌ Não configurado"
    }`
  );
  console.log(
    `   Supabase URL: ${
      DATABASE_CONFIG.supabase.url ? "✅ Configurado" : "❌ Não configurado"
    }`
  );
  console.log(
    `   Supabase Service Key: ${
      DATABASE_CONFIG.supabase.serviceKey
        ? "✅ Configurado"
        : "❌ Não configurado"
    }`
  );
  console.log(
    `   Fallback: ${
      DATABASE_CONFIG.fallback.enabled ? "✅ Habilitado" : "❌ Desabilitado"
    }`
  );
  console.log(`   Primário: ${DATABASE_CONFIG.fallback.primary}`);
}

// Exporta configurações para uso em outros arquivos
export { DATABASE_CONFIG as config };

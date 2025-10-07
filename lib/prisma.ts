/**
 * Cliente Prisma com configuração flexível
 *
 * Este arquivo mantém compatibilidade com o código existente
 * mas agora usa o DatabaseManager para configuração flexível
 */

import { PrismaClient } from "./generated/prisma";
import { dbManager } from "./database-manager";

// Mantém compatibilidade com código existente
export const prisma = dbManager.getPrisma();

// Exporta também o manager para uso avançado
export { dbManager as databaseManager } from "./database-manager";

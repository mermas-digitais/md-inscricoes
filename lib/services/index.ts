/**
 * Índice dos Serviços
 *
 * Exporta todos os serviços para uso nas APIs
 */

export { InscricoesService, inscricoesService } from "./inscricoes-service";
export {
  VerificationService,
  verificationService,
} from "./verification-service";
export { EscolasService, escolasService } from "./escolas-service";

export type { InscricaoData, InscricaoResult } from "./inscricoes-service";
export type {
  VerificationCodeData,
  VerificationResult,
} from "./verification-service";
export type {
  EscolaData,
  EscolaFilters,
  EscolasResult,
} from "./escolas-service";

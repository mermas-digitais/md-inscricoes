/**
 * Índice dos Clientes Abstratos
 *
 * Exporta todos os clientes e utilitários para uso nas APIs
 */

export { DatabaseClient, getDatabaseClient } from "./database-client";
export { HttpClient, ApiClient, httpClient, apiClient } from "./http-client";
export type { DatabaseOperations } from "./database-client";
export type {
  HttpClientConfig,
  RequestOptions,
  HttpResponse,
} from "./http-client";

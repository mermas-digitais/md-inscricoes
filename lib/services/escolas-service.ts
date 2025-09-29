/**
 * Serviço de Escolas
 *
 * Abstrai as operações de escolas usando os clientes abstratos
 */

import { getDatabaseClient } from "../clients/database-client";

/**
 * Dados de escola
 */
export interface EscolaData {
  id: number;
  nome: string;
  tipo: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

/**
 * Filtros de busca
 */
export interface EscolaFilters {
  search?: string;
  limit?: number;
  tipo?: string;
  rede?: string;
  cidade?: string;
  estado?: string;
}

/**
 * Resultado de operação de escolas
 */
export interface EscolasResult {
  success: boolean;
  data?: EscolaData[];
  error?: string;
  total?: number;
  provider?: string;
}

/**
 * Serviço de escolas
 */
export class EscolasService {
  private dbClient: any;

  /**
   * Inicializa o serviço
   */
  private async initialize() {
    if (!this.dbClient) {
      this.dbClient = await getDatabaseClient();
    }
  }

  /**
   * Busca escolas com filtros
   */
  async findEscolas(filters: EscolaFilters = {}): Promise<EscolasResult> {
    try {
      await this.initialize();

      const { search, limit = 50, ...otherFilters } = filters;

      // Por enquanto, vamos usar dados mock
      // Em produção, você pode implementar uma tabela real de escolas
      const escolas = await this.dbClient.findEscolas(search, limit);

      // Aplicar filtros adicionais se necessário
      let filteredEscolas = escolas;

      if (otherFilters.tipo) {
        filteredEscolas = filteredEscolas.filter((escola: EscolaData) =>
          escola.tipo.toLowerCase().includes(otherFilters.tipo!.toLowerCase())
        );
      }

      if (otherFilters.rede) {
        filteredEscolas = filteredEscolas.filter((escola: EscolaData) =>
          escola.tipo.toLowerCase().includes(otherFilters.rede!.toLowerCase())
        );
      }

      if (otherFilters.cidade) {
        filteredEscolas = filteredEscolas.filter((escola: EscolaData) =>
          escola.cidade
            ?.toLowerCase()
            .includes(otherFilters.cidade!.toLowerCase())
        );
      }

      if (otherFilters.estado) {
        filteredEscolas = filteredEscolas.filter((escola: EscolaData) =>
          escola.estado
            ?.toLowerCase()
            .includes(otherFilters.estado!.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredEscolas,
        total: filteredEscolas.length,
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao buscar escolas:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Busca escola por ID
   */
  async findEscolaById(id: number): Promise<EscolasResult> {
    try {
      await this.initialize();

      const escolas = await this.dbClient.findEscolas();
      const escola = escolas.find((e: EscolaData) => e.id === id);

      if (!escola) {
        return {
          success: false,
          error: "Escola não encontrada",
        };
      }

      return {
        success: true,
        data: [escola],
        total: 1,
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao buscar escola por ID:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Busca escolas por tipo
   */
  async findEscolasByTipo(
    tipo: string,
    limit: number = 50
  ): Promise<EscolasResult> {
    return this.findEscolas({ tipo, limit });
  }

  /**
   * Busca escolas por cidade
   */
  async findEscolasByCidade(
    cidade: string,
    limit: number = 50
  ): Promise<EscolasResult> {
    return this.findEscolas({ cidade, limit });
  }

  /**
   * Busca escolas por estado
   */
  async findEscolasByEstado(
    estado: string,
    limit: number = 50
  ): Promise<EscolasResult> {
    return this.findEscolas({ estado, limit });
  }

  /**
   * Busca escolas com paginação
   */
  async findEscolasPaginated(
    page: number = 1,
    limit: number = 20,
    filters: Omit<EscolaFilters, "limit"> = {}
  ): Promise<EscolasResult> {
    try {
      const result = await this.findEscolas({ ...filters, limit: 1000 }); // Buscar todas primeiro

      if (!result.success) {
        return result;
      }

      const escolas = result.data || [];
      const total = escolas.length;
      const offset = (page - 1) * limit;
      const paginatedEscolas = escolas.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedEscolas,
        total,
        provider: result.provider,
      };
    } catch (error) {
      console.error("Erro ao buscar escolas paginadas:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Cria uma nova escola
   */
  async createEscola(data: {
    nome: string;
    rede: string;
    publica?: boolean;
    uf?: string;
    municipio?: string;
  }): Promise<EscolasResult> {
    try {
      await this.initialize();

      // Use the database client to create school
      const result = await this.dbClient.createEscola(data);

      return {
        success: true,
        data: [result],
        total: 1,
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao criar escola:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Estatísticas de escolas
   */
  async getEscolasStats(): Promise<EscolasResult> {
    try {
      await this.initialize();

      const escolas = await this.dbClient.findEscolas();

      const stats = {
        total: escolas.length,
        porTipo: escolas.reduce((acc: any, escola: EscolaData) => {
          acc[escola.tipo] = (acc[escola.tipo] || 0) + 1;
          return acc;
        }, {}),
        porCidade: escolas.reduce((acc: any, escola: EscolaData) => {
          const cidade = escola.cidade || "Não informado";
          acc[cidade] = (acc[cidade] || 0) + 1;
          return acc;
        }, {}),
        porEstado: escolas.reduce((acc: any, escola: EscolaData) => {
          const estado = escola.estado || "Não informado";
          acc[estado] = (acc[estado] || 0) + 1;
          return acc;
        }, {}),
      };

      return {
        success: true,
        data: [stats] as any,
        total: 1,
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas de escolas:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }
}

/**
 * Serviço singleton
 */
export const escolasService = new EscolasService();

/**
 * Serviço de Inscrições
 *
 * Abstrai as operações de inscrições usando os clientes abstratos
 */

import { getDatabaseClient } from "../clients/database-client";
import { apiClient } from "../clients/http-client";

/**
 * Dados de inscrição
 */
export interface InscricaoData {
  email: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  telefone_whatsapp: string;
  escolaridade: string;
  ano_escolar: string;
  escola: string;
}

/**
 * Resultado de inscrição
 */
export interface InscricaoResult {
  success: boolean;
  data?: any;
  error?: string;
  curso?: string;
  status?: string;
  provider?: string;
}

/**
 * Serviço de inscrições
 */
export class InscricoesService {
  private dbClient: any;
  private apiClient: any;

  constructor() {
    this.apiClient = apiClient;
  }

  /**
   * Inicializa o serviço
   */
  private async initialize() {
    if (!this.dbClient) {
      this.dbClient = await getDatabaseClient();
    }
  }

  /**
   * Cria uma nova inscrição
   */
  async createInscricao(
    data: InscricaoData,
    isMDX25: boolean = false
  ): Promise<InscricaoResult> {
    try {
      await this.initialize();

      // Verificar se as inscrições ainda estão abertas
      const deadline = isMDX25
        ? process.env.MDX25_REGISTRATION_DEADLINE
        : process.env.REGISTRATION_DEADLINE;

      if (deadline && new Date() > new Date(deadline)) {
        return {
          success: false,
          error: isMDX25
            ? "Inscrições MDX25 encerradas"
            : "Inscrições encerradas",
        };
      }

      // Determinar curso baseado na escolaridade
      const curso = isMDX25
        ? data.escolaridade === "Ensino Fundamental 2"
          ? "MDX25-Jogos"
          : "MDX25-Robótica"
        : data.escolaridade === "Ensino Fundamental 2"
        ? "Jogos"
        : "Robótica";

      // Verificar quantas inscrições já existem para este curso
      const count = await this.dbClient.countInscricoes({
        curso,
        status: ["INSCRITA", "MATRICULADA"],
      });

      // Definir o status baseado na disponibilidade de vagas
      const LIMITE_VAGAS = isMDX25 ? 100 : 50;
      const status = count >= LIMITE_VAGAS ? "EXCEDENTE" : "INSCRITA";

      // Criar inscrição
      const inscricao = await this.dbClient.createInscricao({
        ...data,
        curso,
        status,
      });

      // Enviar email apropriado baseado no status
      await this.sendEmail(data, curso, status, isMDX25);

      return {
        success: true,
        data: inscricao,
        curso,
        status,
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao criar inscrição:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Verifica se CPF já existe
   */
  async checkCPFExists(
    cpf: string,
    isMDX25: boolean = false
  ): Promise<{ exists: boolean; error?: string }> {
    try {
      await this.initialize();

      // Formatar CPF para comparação (XXX.XXX.XXX-XX)
      const formatCPF = (cpf: string) => {
        const numbers = cpf.replace(/\D/g, "");
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      };

      const formattedCPF = formatCPF(cpf);

      if (isMDX25) {
        // Para MDX25, verificar na tabela participantes_eventos
        const existingParticipante =
          await this.dbClient.findParticipanteEventoByCPF(formattedCPF);
        return {
          exists: !!existingParticipante,
        };
      } else {
        // Para inscrições normais, verificar na tabela inscricoes
        const existingInscricao = await this.dbClient.findInscricaoByCPF(
          formattedCPF
        );
        return {
          exists: !!existingInscricao,
        };
      }
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
      return {
        exists: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Busca inscrições com filtros
   */
  async findInscricoes(
    filters: {
      page?: number;
      limit?: number;
      curso?: string;
      status?: string;
    } = {}
  ) {
    try {
      await this.initialize();

      const { page = 1, limit = 20, ...otherFilters } = filters;
      const offset = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.dbClient.findInscricoes({
          ...otherFilters,
          limit,
          offset,
        }),
        this.dbClient.countInscricoes(otherFilters),
      ]);

      return {
        success: true,
        data: {
          data,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        },
        provider: this.dbClient.getProvider(),
      };
    } catch (error) {
      console.error("Erro ao buscar inscrições:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      };
    }
  }

  /**
   * Envia email apropriado
   */
  private async sendEmail(
    data: InscricaoData,
    curso: string,
    status: string,
    isMDX25: boolean
  ) {
    try {
      const emailData = {
        email: data.email,
        nomeCompleto: data.nome,
        nomeCurso: curso,
        cpf: data.cpf,
      };

      console.log("Enviando email com dados:", emailData, "Status:", status);

      let emailResponse;
      if (status === "EXCEDENTE") {
        emailResponse = await this.apiClient.sendExcedenteEmail(emailData);
      } else {
        emailResponse = await this.apiClient.sendConfirmationEmail(emailData);
      }

      if (!emailResponse.success) {
        console.error(
          `Falha ao enviar email ${
            status === "EXCEDENTE" ? "excedente" : "confirmação"
          }:`,
          emailResponse.error
        );
        // Não falhar a inscrição se o email falhar
      } else {
        console.log(
          `Email ${
            status === "EXCEDENTE" ? "excedente" : "confirmação"
          } enviado com sucesso`
        );
      }
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      // Não falhar a inscrição se o email falhar
    }
  }
}

/**
 * Serviço singleton
 */
export const inscricoesService = new InscricoesService();

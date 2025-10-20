/**
 * Cliente Abstrato de Banco de Dados
 *
 * Fornece uma interface unificada para operações de banco de dados
 * que funciona tanto com Prisma quanto com Supabase
 */

import { PrismaClient } from "@prisma/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { dbManager } from "../database-manager";
import { DatabaseProvider } from "../database-config";

/**
 * Interface para operações de banco de dados
 */
export interface DatabaseOperations {
  // Inscrições
  findInscricoes(filters?: any): Promise<any[]>;
  createInscricao(data: any): Promise<any>;
  countInscricoes(filters?: any): Promise<number>;
  findInscricaoByCPF(cpf: string): Promise<any | null>;

  // Códigos de verificação
  createVerificationCode(data: {
    email: string;
    code: string;
    expiresAt: Date;
  }): Promise<any>;
  findVerificationCode(email: string, code: string): Promise<any | null>;
  findVerificationCodeByCode(code: string): Promise<any | null>;

  // Eventos MDX25
  createOrientador(data: any): Promise<any>;
  findOrientadorByCPF(cpf: string): Promise<any | null>;
  findEventoByName(nome: string): Promise<any | null>;
  findModalidadeByName(nome: string): Promise<any | null>;
  findModalidadeByNameAndEvento(
    nome: string,
    eventoId: string
  ): Promise<any | null>;
  createInscricaoEvento(data: any): Promise<any>;
  createParticipanteEvento(data: any): Promise<any>;
  findParticipanteEventoByCPF(cpf: string): Promise<any | null>;
  deleteVerificationCode(id: string): Promise<void>;
  deleteVerificationCodesByEmail(email: string): Promise<void>;

  // Escolas
  findEscolas(search?: string, limit?: number): Promise<any[]>;
  createEscola(data: any): Promise<any>;

  // Participantes de Eventos
  findParticipanteEventoByCPF(cpf: string): Promise<any | null>;

  // Operações genéricas
  executeQuery(query: string, params?: any[]): Promise<any>;
  query(tableName: string, options?: any): Promise<any>;
  create(tableName: string, data: any): Promise<any>;
  update(tableName: string, args: { where: any; data: any }): Promise<any>;
  updateMany(tableName: string, args: { where: any; data: any }): Promise<any>;
  delete(tableName: string, args: { where: any }): Promise<any>;
  deleteMany(tableName: string, args: { where: any }): Promise<any>;
  testConnection(): Promise<boolean>;
}

/**
 * Implementação para Prisma
 */
class PrismaDatabaseClient implements DatabaseOperations {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = dbManager.getPrisma();
  }

  async findInscricoes(filters: any = {}) {
    const where: any = {};
    if (filters.curso) where.curso = filters.curso;
    if (filters.status) where.status = filters.status;
    if (filters.email) where.email = filters.email;

    return await this.prisma.inscricoes.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  async createInscricao(data: any) {
    return await this.prisma.inscricoes.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async countInscricoes(filters: any = {}) {
    const where: any = {};
    if (filters.curso) where.curso = filters.curso;
    if (filters.status) where.status = filters.status;
    if (filters.email) where.email = filters.email;

    return await this.prisma.inscricoes.count({ where });
  }

  async findInscricaoByCPF(cpf: string) {
    return await this.prisma.inscricoes.findFirst({
      where: { cpf },
    });
  }

  async createVerificationCode(data: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    return await this.prisma.verificationCodes.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  }

  async findVerificationCode(email: string, code: string) {
    return await this.prisma.verificationCodes.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteVerificationCode(id: string) {
    await this.prisma.verificationCodes.delete({
      where: { id },
    });
  }

  async findVerificationCodeByCode(code: string) {
    return await this.prisma.verificationCodes.findFirst({
      where: {
        code: code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async deleteVerificationCodesByEmail(email: string) {
    await this.prisma.verificationCodes.deleteMany({
      where: { email },
    });
  }

  async findEscolas(search?: string, limit?: number) {
    const whereClause = search
      ? {
          nome: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const queryOptions: any = {
      where: whereClause,
      orderBy: { nome: "asc" },
    };

    // Só aplicar limite se especificado
    if (limit !== undefined) {
      queryOptions.take = limit;
    }

    const escolas = await this.prisma.escolas.findMany(queryOptions);

    // Transformar para o formato esperado
    return escolas.map((escola: any) => ({
      id: escola.id,
      nome: escola.nome,
      tipo: escola.rede,
      rede: escola.rede,
      publica: escola.publica,
      uf: escola.uf,
      municipio: escola.municipio,
    }));
  }

  async createEscola(data: any) {
    const newSchool = await this.prisma.escolas.create({
      data: {
        nome: data.nome,
        rede: data.rede,
        publica: data.publica !== false,
        uf: data.uf || "MA",
        municipio: data.municipio || "Imperatriz",
      },
    });

    return {
      id: newSchool.id,
      nome: newSchool.nome,
      tipo: newSchool.rede,
      rede: newSchool.rede,
      publica: newSchool.publica,
      uf: newSchool.uf,
      municipio: newSchool.municipio,
    };
  }

  async findParticipanteEventoByCPF(cpf: string) {
    return await this.prisma.participantesEventos.findFirst({
      where: { cpf },
    });
  }

  // ===== Eventos (implementação Prisma) =====
  async createOrientador(data: any) {
    return await this.prisma.orientadores.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        escola: data.escola,
        genero: data.genero,
        ativo: data.ativo !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findOrientadorByCPF(cpf: string) {
    return await this.prisma.orientadores.findFirst({ where: { cpf } });
  }

  async findEventoByName(nome: string) {
    return await this.prisma.eventos.findFirst({
      where: { nome, ativo: true },
    });
  }

  async findModalidadeByName(nome: string) {
    return await this.prisma.modalidades.findFirst({ where: { nome } });
  }

  async createInscricaoEvento(data: any) {
    return await this.prisma.inscricoesEventos.create({
      data: {
        eventoId: data.eventoId,
        modalidadeId: data.modalidadeId,
        orientadorId: data.orientadorId,
        status: data.status ?? "PENDENTE",
        observacoes: data.observacoes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async createParticipanteEvento(data: any) {
    return await this.prisma.participantesEventos.create({
      data: {
        inscricaoId: data.inscricaoId,
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento: new Date(data.dataNascimento),
        email: data.email ?? null,
        genero: data.genero,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async executeQuery(query: string, params: any[] = []) {
    // Para Prisma, você pode usar $queryRaw para queries SQL
    return await this.prisma.$queryRawUnsafe(query, ...params);
  }

  async query(tableName: string, options?: any): Promise<any> {
    const model = (this.prisma as any)[tableName];
    if (!model) {
      throw new Error(`Model ${tableName} not found`);
    }

    if (options?.where && options?.include) {
      return await model.findMany(options);
    } else if (options?.where) {
      return await model.findMany(options);
    } else {
      return await model.findMany(options || {});
    }
  }

  async create(tableName: string, data: any): Promise<any> {
    const model = (this.prisma as any)[tableName];
    if (!model) {
      throw new Error(`Model ${tableName} not found`);
    }

    return await model.create({ data });
  }

  async update(tableName: string, args: { where: any; data: any }) {
    const model = (this.prisma as any)[tableName];
    if (!model) throw new Error(`Model ${tableName} not found`);
    return await model.update(args);
  }

  async updateMany(tableName: string, args: { where: any; data: any }) {
    const model = (this.prisma as any)[tableName];
    if (!model) throw new Error(`Model ${tableName} not found`);
    return await model.updateMany(args);
  }

  async delete(tableName: string, args: { where: any }) {
    const model = (this.prisma as any)[tableName];
    if (!model) throw new Error(`Model ${tableName} not found`);
    return await model.delete(args);
  }

  async deleteMany(tableName: string, args: { where: any }) {
    const model = (this.prisma as any)[tableName];
    if (!model) throw new Error(`Model ${tableName} not found`);
    return await model.deleteMany(args);
  }

  async testConnection() {
    try {
      await this.prisma.$connect();
      await this.prisma.$disconnect();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Implementação para Supabase
 */
class SupabaseDatabaseClient implements DatabaseOperations {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = dbManager.getSupabase();
  }

  async findInscricoes(filters: any = {}) {
    let query = this.supabase
      .from("inscricoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.curso) query = query.eq("curso", filters.curso);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.email) query = query.eq("email", filters.email);
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset)
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 100) - 1
      );

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createInscricao(data: any) {
    const { data: result, error } = await this.supabase
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

  async countInscricoes(filters: any = {}) {
    let query = this.supabase
      .from("inscricoes")
      .select("*", { count: "exact", head: true });

    if (filters.curso) query = query.eq("curso", filters.curso);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.email) query = query.eq("email", filters.email);

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async findInscricaoByCPF(cpf: string) {
    const { data, error } = await this.supabase
      .from("inscricoes")
      .select("*")
      .eq("cpf", cpf)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data || null;
  }

  async createVerificationCode(data: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    const { data: result, error } = await this.supabase
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

  async findVerificationCode(email: string, code: string) {
    const { data, error } = await this.supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data || null;
  }

  async findVerificationCodeByCode(code: string) {
    const { data, error } = await this.supabase
      .from("verification_codes")
      .select("*")
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data || null;
  }

  async deleteVerificationCode(id: string) {
    const { error } = await this.supabase
      .from("verification_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async deleteVerificationCodesByEmail(email: string) {
    const { error } = await this.supabase
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (error) throw error;
  }

  async findEscolas(search?: string, limit?: number) {
    let query = this.supabase
      .from("escolas")
      .select("*")
      .order("nome", { ascending: true });

    if (search) {
      query = this.supabase
        .from("escolas")
        .select("*")
        .ilike("nome", `%${search}%`)
        .order("nome", { ascending: true });
    }

    // Só aplicar limite se especificado
    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transformar para o formato esperado
    return (data || []).map((escola: any) => ({
      id: escola.id,
      nome: escola.nome,
      tipo: escola.rede,
      rede: escola.rede,
      publica: escola.publica,
      uf: escola.uf,
      municipio: escola.municipio,
    }));
  }

  async createEscola(data: any) {
    const { data: newSchool, error } = await this.supabase
      .from("escolas")
      .insert({
        nome: data.nome,
        rede: data.rede,
        publica: data.publica !== false,
        uf: data.uf || "MA",
        municipio: data.municipio || "Imperatriz",
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: newSchool.id,
      nome: newSchool.nome,
      tipo: newSchool.rede,
      rede: newSchool.rede,
      publica: newSchool.publica,
      uf: newSchool.uf,
      municipio: newSchool.municipio,
    };
  }

  async findParticipanteEventoByCPF(cpf: string) {
    const { data, error } = await this.supabase
      .from("participantes_eventos")
      .select("*")
      .eq("cpf", cpf)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data || null;
  }

  async executeQuery(query: string, params: any[] = []) {
    // Para Supabase, você pode usar RPC para stored procedures
    // ou implementar queries SQL específicas
    throw new Error("executeQuery not implemented for Supabase client");
  }

  async query(tableName: string, options?: any): Promise<any> {
    // Aplicar mapeamento para snake_case nas opções
    const { toSnakeCaseWhere, toSnakeCaseOrderBy, fromSnakeCaseRows } =
      await import("./supabase-mapping");

    let query = this.supabase.from(this.tableToSnake(tableName)).select("*");

    if (options?.where) {
      const where = toSnakeCaseWhere(
        this.tableToSnake(tableName),
        options.where
      );
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value as any);
      });
    }

    if (options?.orderBy) {
      const orderBy = toSnakeCaseOrderBy(
        this.tableToSnake(tableName),
        options.orderBy
      );
      Object.entries(orderBy).forEach(([key, value]) => {
        query = query.order(key, { ascending: value === "asc" });
      });
    }

    if (options?.take) {
      query = query.limit(options.take);
    }

    const { data, error } = await query;
    if (error) throw error;
    return fromSnakeCaseRows(this.tableToSnake(tableName), data || []);
  }

  async create(tableName: string, data: any): Promise<any> {
    const { toSnakeCaseData, fromSnakeCaseRow } = await import(
      "./supabase-mapping"
    );
    const payload = toSnakeCaseData(
      this.tableToSnake(tableName),
      data.data ?? data
    );
    const { data: result, error } = await this.supabase
      .from(this.tableToSnake(tableName))
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return fromSnakeCaseRow(this.tableToSnake(tableName), result);
  }

  async update(tableName: string, args: { where: any; data: any }) {
    const { toSnakeCaseData, toSnakeCaseWhere } = await import(
      "./supabase-mapping"
    );
    const payload = toSnakeCaseData(this.tableToSnake(tableName), args.data);
    const where = toSnakeCaseWhere(this.tableToSnake(tableName), args.where);
    let query = this.supabase
      .from(this.tableToSnake(tableName))
      .update(payload);
    Object.entries(where).forEach(([k, v]) => (query = query.eq(k, v as any)));
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data
      ? (await import("./supabase-mapping")).fromSnakeCaseRow(
          this.tableToSnake(tableName),
          data
        )
      : null;
  }

  async updateMany(tableName: string, args: { where: any; data: any }) {
    const { toSnakeCaseData, toSnakeCaseWhere } = await import(
      "./supabase-mapping"
    );
    const payload = toSnakeCaseData(this.tableToSnake(tableName), args.data);
    const where = toSnakeCaseWhere(this.tableToSnake(tableName), args.where);
    let query = this.supabase
      .from(this.tableToSnake(tableName))
      .update(payload);
    Object.entries(where).forEach(([k, v]) => (query = query.eq(k, v as any)));
    const { data, error } = await query.select();
    if (error) throw error;
    return (await import("./supabase-mapping")).fromSnakeCaseRows(
      this.tableToSnake(tableName),
      data || []
    );
  }

  async delete(tableName: string, args: { where: any }) {
    const { toSnakeCaseWhere } = await import("./supabase-mapping");
    const where = toSnakeCaseWhere(this.tableToSnake(tableName), args.where);
    let query = this.supabase.from(this.tableToSnake(tableName)).delete();
    Object.entries(where).forEach(([k, v]) => (query = query.eq(k, v as any)));
    const { data, error } = await query.select().maybeSingle();
    if (error) throw error;
    return data
      ? (await import("./supabase-mapping")).fromSnakeCaseRow(
          this.tableToSnake(tableName),
          data
        )
      : null;
  }

  async deleteMany(tableName: string, args: { where: any }) {
    const { toSnakeCaseWhere } = await import("./supabase-mapping");
    const where = toSnakeCaseWhere(this.tableToSnake(tableName), args.where);
    let query = this.supabase.from(this.tableToSnake(tableName)).delete();
    Object.entries(where).forEach(([k, v]) => (query = query.eq(k, v as any)));
    const { data, error } = await query.select();
    if (error) throw error;
    return (await import("./supabase-mapping")).fromSnakeCaseRows(
      this.tableToSnake(tableName),
      data || []
    );
  }

  private tableToSnake(table: string) {
    // Mapear nomes de modelos Prisma/camel para as tabelas reais
    const map: Record<string, string> = {
      eventos: "eventos",
      modalidades: "modalidades",
      orientadores: "orientadores",
      inscricoesEventos: "inscricoes_eventos",
      participantesEventos: "participantes_eventos",
      verificationCodes: "verification_codes",
      turmasAlunas: "turmas_alunas",
      turmasMonitores: "turmas_monitores",
      materiaisAula: "materiais_aula",
    };
    return map[table] ?? table;
  }

  async testConnection() {
    try {
      const { error } = await this.supabase
        .from("inscricoes")
        .select("id")
        .limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Métodos de eventos MDX25
  async createOrientador(data: any) {
    const { data: result, error } = await this.supabase
      .from("orientadores")
      .insert({
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        escola: data.escola,
        genero: data.genero,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findOrientadorByCPF(cpf: string) {
    const { data, error } = await this.supabase
      .from("orientadores")
      .select("*")
      .eq("cpf", cpf)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async findEventoByName(nome: string) {
    const { data, error } = await this.supabase
      .from("eventos")
      .select("*")
      .eq("nome", nome)
      .eq("ativo", true)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async findModalidadeByName(nome: string) {
    const { data, error } = await this.supabase
      .from("modalidades")
      .select("*")
      .eq("nome", nome)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async findModalidadeByNameAndEvento(nome: string, eventoId: string) {
    const { data, error } = await this.supabase
      .from("modalidades")
      .select("*")
      .eq("nome", nome)
      .eq("evento_id", eventoId)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  async createInscricaoEvento(data: any) {
    const { data: result, error } = await this.supabase
      .from("inscricoes_eventos")
      .insert({
        evento_id: data.eventoId,
        modalidade_id: data.modalidadeId,
        orientador_id: data.orientadorId,
        nome_equipe: data.nomeEquipe,
        status: data.status,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async createParticipanteEvento(data: any) {
    const { data: result, error } = await this.supabase
      .from("participantes_eventos")
      .insert({
        inscricao_id: data.inscricaoId,
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.dataNascimento,
        genero: data.genero,
        ouvinte: data.ouvinte === true,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}

/**
 * Cliente de banco de dados abstrato
 */
export class DatabaseClient {
  private static instance: DatabaseClient;
  private operations!: DatabaseOperations;
  private provider!: DatabaseProvider;

  private constructor() {
    // Será inicializado no método getInstance
  }

  public static async getInstance(): Promise<DatabaseClient> {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
      await DatabaseClient.instance.initialize();
    }
    return DatabaseClient.instance;
  }

  private async initialize() {
    this.provider = await dbManager.getActiveProvider();

    if (this.provider === "prisma") {
      this.operations = new PrismaDatabaseClient();
    } else {
      this.operations = new SupabaseDatabaseClient();
    }

    console.log(`🗄️ DatabaseClient inicializado com ${this.provider}`);
  }

  /**
   * Obtém o provedor atual
   */
  public getProvider(): DatabaseProvider {
    return this.provider;
  }

  /**
   * Força reinicialização (útil para mudanças de configuração)
   */
  public async reconnect(): Promise<void> {
    await dbManager.reconnect();
    await this.initialize();
  }

  /**
   * Testa conexão
   */
  public async testConnection(): Promise<boolean> {
    return await this.operations.testConnection();
  }

  // Métodos de conveniência que delegam para as operações
  public async findInscricoes(filters?: any) {
    return await this.operations.findInscricoes(filters);
  }

  public async createInscricao(data: any) {
    return await this.operations.createInscricao(data);
  }

  public async countInscricoes(filters?: any) {
    return await this.operations.countInscricoes(filters);
  }

  public async findInscricaoByCPF(cpf: string) {
    return await this.operations.findInscricaoByCPF(cpf);
  }

  public async createVerificationCode(data: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    return await this.operations.createVerificationCode(data);
  }

  public async findVerificationCode(email: string, code: string) {
    return await this.operations.findVerificationCode(email, code);
  }

  public async findVerificationCodeByCode(code: string) {
    return await this.operations.findVerificationCodeByCode(code);
  }

  public async deleteVerificationCode(id: string) {
    return await this.operations.deleteVerificationCode(id);
  }

  public async deleteVerificationCodesByEmail(email: string) {
    return await this.operations.deleteVerificationCodesByEmail(email);
  }

  public async findEscolas(search?: string, limit?: number) {
    return await this.operations.findEscolas(search, limit);
  }

  public async createEscola(data: any) {
    return await this.operations.createEscola(data);
  }

  public async findParticipanteEventoByCPF(cpf: string) {
    return await this.operations.findParticipanteEventoByCPF(cpf);
  }

  // Métodos de eventos MDX25
  public async createOrientador(data: any) {
    return await this.operations.createOrientador(data);
  }

  public async findOrientadorByCPF(cpf: string) {
    return await this.operations.findOrientadorByCPF(cpf);
  }

  public async findEventoByName(nome: string) {
    return await this.operations.findEventoByName(nome);
  }

  public async findModalidadeByName(nome: string) {
    return await this.operations.findModalidadeByName(nome);
  }

  public async findModalidadeByNameAndEvento(nome: string, eventoId: string) {
    return await this.operations.findModalidadeByNameAndEvento(nome, eventoId);
  }

  public async createInscricaoEvento(data: any) {
    return await this.operations.createInscricaoEvento(data);
  }

  public async createParticipanteEvento(data: any) {
    return await this.operations.createParticipanteEvento(data);
  }

  public async query(tableName: string, options?: any) {
    return await this.operations.query(tableName, options);
  }

  public async create(tableName: string, data: any) {
    return await this.operations.create(tableName, data);
  }

  public async update(tableName: string, args: { where: any; data: any }) {
    return await this.operations.update(tableName, args);
  }

  public async updateMany(tableName: string, args: { where: any; data: any }) {
    return await this.operations.updateMany(tableName, args);
  }

  public async delete(tableName: string, args: { where: any }) {
    return await this.operations.delete(tableName, args);
  }

  public async deleteMany(tableName: string, args: { where: any }) {
    return await this.operations.deleteMany(tableName, args);
  }

  public async executeQuery(query: string, params?: any[]) {
    return await this.operations.executeQuery(query, params);
  }
}

// Instância singleton
export const getDatabaseClient = () => DatabaseClient.getInstance();

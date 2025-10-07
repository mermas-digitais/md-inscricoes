/**
 * Configuração do banco de dados MDX25
 *
 * Este arquivo será usado para conectar ao banco PostgreSQL do MDX25
 * quando as credenciais forem fornecidas.
 */

// TODO: Substituir pelas credenciais reais do banco MDX25
export const MDX25_DB_CONFIG = {
  host: process.env.MDX25_DB_HOST || "localhost",
  port: parseInt(process.env.MDX25_DB_PORT || "5432"),
  database: process.env.MDX25_DB_NAME || "mdx25",
  username: process.env.MDX25_DB_USER || "postgres",
  password: process.env.MDX25_DB_PASSWORD || "",
  ssl:
    process.env.MDX25_DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

// Função para criar conexão com o banco MDX25
export async function createMDX25Connection() {
  // TODO: Implementar conexão com PostgreSQL
  // Exemplo usando pg (PostgreSQL client):
  /*
  import { Pool } from 'pg';
  
  const pool = new Pool(MDX25_DB_CONFIG);
  return pool;
  */

  console.log("MDX25 Database connection not yet implemented");
  return null;
}

// Função para executar queries no banco MDX25
export async function executeMDX25Query(query: string, params: any[] = []) {
  // TODO: Implementar execução de queries
  console.log("MDX25 Query execution not yet implemented");
  console.log("Query:", query);
  console.log("Params:", params);
  return null;
}

// Funções específicas para MDX25
export const MDX25Queries = {
  // Verificar se CPF já existe
  checkCPFExists: (cpf: string) => `
    SELECT id FROM inscricoes_mdx25 
    WHERE cpf = $1 
    LIMIT 1
  `,

  // Inserir nova inscrição
  insertInscricao: () => `
    INSERT INTO inscricoes_mdx25 (
      email, nome, cpf, data_nascimento, cep, logradouro, numero, 
      complemento, bairro, cidade, estado, nome_responsavel, 
      telefone_whatsapp, escolaridade, ano_escolar, escola, 
      curso, status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
    ) RETURNING id
  `,

  // Contar inscrições por curso
  countInscricoesByCurso: (curso: string) => `
    SELECT COUNT(*) as total 
    FROM inscricoes_mdx25 
    WHERE curso = $1 AND status IN ('INSCRITA', 'MATRICULADA')
  `,

  // Buscar escolas
  searchEscolas: (search: string, limit: number) => `
    SELECT id, nome, tipo 
    FROM escolas_mdx25 
    WHERE LOWER(nome) LIKE LOWER($1) 
    ORDER BY nome 
    LIMIT $2
  `,

  // Inserir código de verificação
  insertVerificationCode: () => `
    INSERT INTO verification_codes_mdx25 (email, code, expires_at, created_at)
    VALUES ($1, $2, $3, NOW())
  `,

  // Verificar código de verificação
  verifyCode: (email: string, code: string) => `
    SELECT id FROM verification_codes_mdx25 
    WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false
    LIMIT 1
  `,

  // Marcar código como usado
  markCodeAsUsed: (id: string) => `
    UPDATE verification_codes_mdx25 
    SET used = true, used_at = NOW() 
    WHERE id = $1
  `,
};

// Schema das tabelas MDX25
export const MDX25_SCHEMA = {
  inscricoes_mdx25: `
    CREATE TABLE IF NOT EXISTS inscricoes_mdx25 (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      cpf VARCHAR(14) NOT NULL UNIQUE,
      data_nascimento DATE NOT NULL,
      cep VARCHAR(9) NOT NULL,
      logradouro VARCHAR(255) NOT NULL,
      numero VARCHAR(20) NOT NULL,
      complemento VARCHAR(100),
      bairro VARCHAR(100) NOT NULL,
      cidade VARCHAR(255) NOT NULL,
      estado VARCHAR(2) NOT NULL,
      nome_responsavel VARCHAR(255) NOT NULL,
      telefone_whatsapp VARCHAR(15) NOT NULL,
      escolaridade VARCHAR(50) NOT NULL,
      ano_escolar VARCHAR(10) NOT NULL,
      escola VARCHAR(255) NOT NULL,
      curso VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'INSCRITA' CHECK (status IN ('INSCRITA', 'MATRICULADA', 'CANCELADA', 'EXCEDENTE')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  verification_codes_mdx25: `
    CREATE TABLE IF NOT EXISTS verification_codes_mdx25 (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  escolas_mdx25: `
    CREATE TABLE IF NOT EXISTS escolas_mdx25 (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('Municipal', 'Estadual', 'Federal', 'Particular')),
      cidade TEXT DEFAULT 'Imperatriz',
      estado TEXT DEFAULT 'MA',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
};

// Função para criar todas as tabelas MDX25
export async function createMDX25Tables() {
  console.log("Creating MDX25 tables...");

  // TODO: Implementar criação das tabelas
  // for (const [tableName, schema] of Object.entries(MDX25_SCHEMA)) {
  //   await executeMDX25Query(schema);
  //   console.log(`Created table: ${tableName}`);
  // }

  console.log("MDX25 tables creation not yet implemented");
}

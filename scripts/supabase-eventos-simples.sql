-- ===============================================
-- SCRIPT SIMPLES PARA ADICIONAR TABELAS DE EVENTOS NO SUPABASE
-- ===============================================

-- Habilitar extensão UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- TABELA: eventos
-- ===============================================
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_nome ON eventos(nome);
CREATE INDEX IF NOT EXISTS idx_eventos_ativo ON eventos(ativo);

-- ===============================================
-- TABELA: orientadores
-- ===============================================
CREATE TABLE IF NOT EXISTS orientadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  escola VARCHAR(255) NOT NULL,
  genero VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para orientadores
CREATE INDEX IF NOT EXISTS idx_orientadores_cpf ON orientadores(cpf);
CREATE INDEX IF NOT EXISTS idx_orientadores_email ON orientadores(email);

-- ===============================================
-- TABELA: modalidades
-- ===============================================
CREATE TABLE IF NOT EXISTS modalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  limite_vagas INTEGER NOT NULL DEFAULT 0,
  vagas_ocupadas INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para modalidades
CREATE INDEX IF NOT EXISTS idx_modalidades_evento_id ON modalidades(evento_id);

-- ===============================================
-- TABELA: inscricoes_eventos
-- ===============================================
CREATE TABLE IF NOT EXISTS inscricoes_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  orientador_id UUID NOT NULL REFERENCES orientadores(id) ON DELETE CASCADE,
  modalidade_id UUID NOT NULL REFERENCES modalidades(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para inscricoes_eventos
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_evento_id ON inscricoes_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_orientador_id ON inscricoes_eventos(orientador_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_modalidade_id ON inscricoes_eventos(modalidade_id);

-- ===============================================
-- TABELA: participantes_eventos
-- ===============================================
CREATE TABLE IF NOT EXISTS participantes_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscricao_id UUID NOT NULL REFERENCES inscricoes_eventos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  data_nascimento DATE NOT NULL,
  email VARCHAR(255),
  genero VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para participantes_eventos
CREATE INDEX IF NOT EXISTS idx_participantes_eventos_inscricao_id ON participantes_eventos(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_participantes_eventos_cpf ON participantes_eventos(cpf);

-- ===============================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS PARA updated_at
-- ===============================================
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orientadores_updated_at 
    BEFORE UPDATE ON orientadores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modalidades_updated_at 
    BEFORE UPDATE ON modalidades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscricoes_eventos_updated_at 
    BEFORE UPDATE ON inscricoes_eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participantes_eventos_updated_at 
    BEFORE UPDATE ON participantes_eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================
SELECT 
    'eventos' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eventos') 
         THEN '✅ CRIADA' ELSE '❌ FALTANDO' END as status
UNION ALL
SELECT 
    'orientadores' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orientadores') 
         THEN '✅ CRIADA' ELSE '❌ FALTANDO' END as status
UNION ALL
SELECT 
    'modalidades' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modalidades') 
         THEN '✅ CRIADA' ELSE '❌ FALTANDO' END as status
UNION ALL
SELECT 
    'inscricoes_eventos' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inscricoes_eventos') 
         THEN '✅ CRIADA' ELSE '❌ FALTANDO' END as status
UNION ALL
SELECT 
    'participantes_eventos' as tabela,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'participantes_eventos') 
         THEN '✅ CRIADA' ELSE '❌ FALTANDO' END as status;

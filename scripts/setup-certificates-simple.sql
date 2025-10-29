-- Script SQL Simplificado para Sistema de Certificados
-- Execute este script no seu banco PostgreSQL

-- 1. Adicionar campos na tabela inscricoes
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS data_conclusao DATE;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS certificado_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS certificado_enviado_em TIMESTAMPTZ;

-- 2. Criar tabela certificados_config
CREATE TABLE IF NOT EXISTS certificados_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edicao VARCHAR(50) NOT NULL,
    template_url VARCHAR(500) NOT NULL,
    ativo BOOLEAN DEFAULT FALSE,
    posicoes JSONB NOT NULL,
    fontes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_inscricoes_certificado_enviado ON inscricoes(certificado_enviado);
CREATE INDEX IF NOT EXISTS idx_certificados_config_ativo ON certificados_config(ativo);
CREATE INDEX IF NOT EXISTS idx_certificados_config_edicao ON certificados_config(edicao);

-- 4. Inserir configuração inicial
INSERT INTO certificados_config (edicao, template_url, ativo, posicoes, fontes) VALUES (
    '2024.2',
    '/assets/certificados/template_default.jpg',
    TRUE,
    '{"nome": {"x": 150, "y": 180}, "cpf": {"x": 150, "y": 220}, "data": {"x": 150, "y": 260}, "carga_horaria": {"x": 150, "y": 300}}',
    '{"nome": {"size": 18, "color": "#2D3748", "family": "helvetica"}, "cpf": {"size": 14, "color": "#4A5568", "family": "helvetica"}, "data": {"size": 14, "color": "#4A5568", "family": "helvetica"}, "carga_horaria": {"size": 14, "color": "#4A5568", "family": "helvetica"}}'
);

-- 5. Verificar se foi criado corretamente
SELECT 'Tabela certificados_config criada com sucesso!' as status;
SELECT id, edicao, template_url, ativo FROM certificados_config WHERE ativo = TRUE;

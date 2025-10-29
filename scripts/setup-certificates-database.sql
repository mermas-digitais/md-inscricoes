-- Script SQL para criar o sistema de certificados
-- Execute este script no banco PostgreSQL para adicionar as tabelas e campos necessários

-- =====================================================
-- 1. ADICIONAR CAMPOS NA TABELA INSCRICOES
-- =====================================================

-- Adicionar campo data_conclusao
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS data_conclusao DATE;

-- Adicionar campo certificado_enviado
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS certificado_enviado BOOLEAN DEFAULT FALSE;

-- Adicionar campo certificado_enviado_em
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS certificado_enviado_em TIMESTAMPTZ;

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_inscricoes_certificado_enviado 
ON inscricoes(certificado_enviado);

-- =====================================================
-- 2. CRIAR TABELA CERTIFICADOS_CONFIG
-- =====================================================

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

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_certificados_config_ativo 
ON certificados_config(ativo);

CREATE INDEX IF NOT EXISTS idx_certificados_config_edicao 
ON certificados_config(edicao);

-- =====================================================
-- 3. INSERIR CONFIGURAÇÃO INICIAL DE CERTIFICADO
-- =====================================================

-- Inserir configuração padrão (ajuste as posições conforme seu template)
INSERT INTO certificados_config (
    edicao,
    template_url,
    ativo,
    posicoes,
    fontes
) VALUES (
    '2024.2',
    '/assets/certificados/template_default.jpg',
    TRUE,
    '{
        "nome": {"x": 150, "y": 180},
        "cpf": {"x": 150, "y": 220},
        "data": {"x": 150, "y": 260},
        "carga_horaria": {"x": 150, "y": 300}
    }'::jsonb,
    '{
        "nome": {"size": 18, "color": "#2D3748", "family": "helvetica"},
        "cpf": {"size": 14, "color": "#4A5568", "family": "helvetica"},
        "data": {"size": 14, "color": "#4A5568", "family": "helvetica"},
        "carga_horaria": {"size": 14, "color": "#4A5568", "family": "helvetica"}
    }'::jsonb
);

-- =====================================================
-- 4. VERIFICAR SE AS TABELAS FORAM CRIADAS CORRETAMENTE
-- =====================================================

-- Verificar estrutura da tabela inscricoes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inscricoes' 
AND column_name IN ('data_conclusao', 'certificado_enviado', 'certificado_enviado_em')
ORDER BY ordinal_position;

-- Verificar estrutura da tabela certificados_config
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'certificados_config'
ORDER BY ordinal_position;

-- Verificar configuração inserida
SELECT id, edicao, template_url, ativo, posicoes, fontes, created_at
FROM certificados_config
WHERE ativo = TRUE;

-- =====================================================
-- 5. COMENTÁRIOS E INSTRUÇÕES
-- =====================================================

/*
INSTRUÇÕES DE USO:

1. EXECUTE ESTE SCRIPT COMPLETO no seu banco PostgreSQL
2. SUBSTITUA o template_url pelo caminho correto do seu arquivo de certificado
3. AJUSTE as posições (x, y) conforme seu template de certificado
4. TESTE o sistema com uma aluna antes de usar em massa

CAMPOS ADICIONADOS EM INSCRICOES:
- data_conclusao: Data de conclusão do curso
- certificado_enviado: Flag indicando se o certificado foi enviado
- certificado_enviado_em: Timestamp do envio do certificado

NOVA TABELA CERTIFICADOS_CONFIG:
- Armazena configurações de templates de certificado
- Permite múltiplas configurações por edição
- Apenas uma configuração pode estar ativa por vez

PRÓXIMOS PASSOS:
1. Fazer upload do template de certificado em public/assets/certificados/
2. Atualizar a configuração com o caminho correto do template
3. Ajustar as posições dos campos conforme seu template
4. Testar o envio de certificados
*/

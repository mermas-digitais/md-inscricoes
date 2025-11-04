-- Script SQL Simplificado - Apenas tabela CERTIFICADOS
-- Execute este script para criar a estrutura simplificada

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
-- 2. CRIAR TABELA CERTIFICADOS (SIMPLIFICADA)
-- =====================================================

CREATE TABLE IF NOT EXISTS certificados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluna_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
    template_url VARCHAR(500) NOT NULL DEFAULT '/assets/certificados/A4.png',
    posicoes JSONB NOT NULL DEFAULT '{
        "nome": {"x": 150, "y": 180},
        "cpf": {"x": 150, "y": 220},
        "data": {"x": 150, "y": 260},
        "carga_horaria": {"x": 150, "y": 300}
    }',
    fontes JSONB NOT NULL DEFAULT '{
        "nome": {"size": 18, "color": "#2D3748", "family": "helvetica"},
        "cpf": {"size": 14, "color": "#4A5568", "family": "helvetica"},
        "data": {"size": 14, "color": "#4A5568", "family": "helvetica"},
        "carga_horaria": {"size": 14, "color": "#4A5568", "family": "helvetica"}
    }',
    enviado_em TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_certificados_aluna_id ON certificados(aluna_id);
CREATE INDEX IF NOT EXISTS idx_certificados_enviado_em ON certificados(enviado_em);

-- =====================================================
-- 3. REMOVER TABELA CERTIFICADOS_CONFIG (SE EXISTIR)
-- =====================================================

DROP TABLE IF EXISTS certificados_config;

-- =====================================================
-- 4. VERIFICAR SE AS TABELAS FORAM CRIADAS CORRETAMENTE
-- =====================================================

-- Verificar estrutura da tabela inscricoes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inscricoes' 
AND column_name IN ('data_conclusao', 'certificado_enviado', 'certificado_enviado_em')
ORDER BY ordinal_position;

-- Verificar estrutura da tabela certificados
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'certificados'
ORDER BY ordinal_position;

-- Mostrar mensagem de sucesso
SELECT '✅ Estrutura simplificada criada com sucesso!' as status;
SELECT '📝 Próximo passo: Atualizar o CertificateService para usar a nova estrutura' as proximo_passo;

/*
ESTRUTURA SIMPLIFICADA:

TABELA CERTIFICADOS:
- id: UUID único do certificado
- aluna_id: Referência para a aluna
- template_url: Caminho do template usado
- posicoes: Coordenadas dos campos (JSON)
- fontes: Configurações de fonte (JSON)
- enviado_em: Quando foi enviado
- created_at: Quando foi criado

VANTAGENS:
- Mais simples de gerenciar
- Histórico de certificados enviados
- Cada certificado tem suas próprias configurações
- Fácil de consultar e relatar
*/

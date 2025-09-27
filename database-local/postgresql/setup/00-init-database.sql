-- ===============================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS
-- ===============================================
-- Este script é executado automaticamente pelo PostgreSQL
-- quando o container é criado pela primeira vez

-- ===============================================
-- CONFIGURAÇÕES INICIAIS
-- ===============================================
SET timezone = 'America/Sao_Paulo';

-- ===============================================
-- EXTENSÕES NECESSÁRIAS
-- ===============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===============================================
-- MENSAGEM DE BOAS-VINDAS
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE '🚀 BANCO DE DADOS MERMÃS DIGITAIS INICIADO!';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📊 Banco: mermas_digitais_db';
    RAISE NOTICE '👤 Usuário: postgres';
    RAISE NOTICE '🔗 Host: localhost:5432';
    RAISE NOTICE '🔧 Use psql ou cliente PostgreSQL para conectar';
    RAISE NOTICE '===============================================';
END $$;

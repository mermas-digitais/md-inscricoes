-- ===============================================
-- SCRIPT PARA ADICIONAR TABELAS DE EVENTOS NO SUPABASE
-- ===============================================
-- Este script adiciona as tabelas necessárias para o sistema de eventos
-- que existem no banco local mas não no Supabase

-- Verificar se a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- FUNÇÕES AUXILIARES (se não existirem)
-- ===============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- NOVAS TABELAS PARA EVENTOS
-- ===============================================

-- Tabela: eventos
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

-- Comentários para tabela de eventos
COMMENT ON TABLE eventos IS 'Tabela de eventos das Mermãs Digitais';
COMMENT ON COLUMN eventos.nome IS 'Nome do evento';
COMMENT ON COLUMN eventos.descricao IS 'Descrição detalhada do evento';
COMMENT ON COLUMN eventos.data_inicio IS 'Data e hora de início do evento';
COMMENT ON COLUMN eventos.data_fim IS 'Data e hora de fim do evento';
COMMENT ON COLUMN eventos.ativo IS 'Se o evento está ativo para inscrições';

-- Índices para tabela de eventos
CREATE INDEX IF NOT EXISTS idx_eventos_nome ON eventos(nome);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_ativo ON eventos(ativo);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos(created_at);

-- Tabela: orientadores
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

-- Comentários para tabela de orientadores
COMMENT ON TABLE orientadores IS 'Tabela de orientadores que fazem inscrições em grupo';
COMMENT ON COLUMN orientadores.nome IS 'Nome completo do orientador';
COMMENT ON COLUMN orientadores.cpf IS 'CPF do orientador (único)';
COMMENT ON COLUMN orientadores.telefone IS 'Telefone de contato';
COMMENT ON COLUMN orientadores.email IS 'Email do orientador (único)';
COMMENT ON COLUMN orientadores.escola IS 'Escola onde o orientador trabalha';
COMMENT ON COLUMN orientadores.genero IS 'Gênero do orientador';

-- Índices para tabela de orientadores
CREATE INDEX IF NOT EXISTS idx_orientadores_cpf ON orientadores(cpf);
CREATE INDEX IF NOT EXISTS idx_orientadores_email ON orientadores(email);
CREATE INDEX IF NOT EXISTS idx_orientadores_escola ON orientadores(escola);
CREATE INDEX IF NOT EXISTS idx_orientadores_ativo ON orientadores(ativo);

-- Tabela: modalidades
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

-- Comentários para tabela de modalidades
COMMENT ON TABLE modalidades IS 'Modalidades de cada evento';
COMMENT ON COLUMN modalidades.evento_id IS 'ID do evento ao qual a modalidade pertence';
COMMENT ON COLUMN modalidades.nome IS 'Nome da modalidade';
COMMENT ON COLUMN modalidades.descricao IS 'Descrição da modalidade';
COMMENT ON COLUMN modalidades.limite_vagas IS 'Limite máximo de vagas';
COMMENT ON COLUMN modalidades.vagas_ocupadas IS 'Número de vagas já ocupadas';

-- Índices para tabela de modalidades
CREATE INDEX IF NOT EXISTS idx_modalidades_evento_id ON modalidades(evento_id);
CREATE INDEX IF NOT EXISTS idx_modalidades_nome ON modalidades(nome);
CREATE INDEX IF NOT EXISTS idx_modalidades_ativo ON modalidades(ativo);

-- Tabela: inscricoes_eventos
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

-- Comentários para tabela de inscrições de eventos
COMMENT ON TABLE inscricoes_eventos IS 'Inscrições em grupo feitas por orientadores';
COMMENT ON COLUMN inscricoes_eventos.evento_id IS 'ID do evento';
COMMENT ON COLUMN inscricoes_eventos.orientador_id IS 'ID do orientador responsável';
COMMENT ON COLUMN inscricoes_eventos.modalidade_id IS 'ID da modalidade escolhida';
COMMENT ON COLUMN inscricoes_eventos.status IS 'Status da inscrição: PENDENTE, APROVADA, REJEITADA, CANCELADA';
COMMENT ON COLUMN inscricoes_eventos.observacoes IS 'Observações sobre a inscrição';

-- Índices para tabela de inscrições de eventos
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_evento_id ON inscricoes_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_orientador_id ON inscricoes_eventos(orientador_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_modalidade_id ON inscricoes_eventos(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_status ON inscricoes_eventos(status);

-- Tabela: participantes_eventos
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

-- Comentários para tabela de participantes de eventos
COMMENT ON TABLE participantes_eventos IS 'Participantes individuais de cada inscrição em grupo';
COMMENT ON COLUMN participantes_eventos.inscricao_id IS 'ID da inscrição em grupo';
COMMENT ON COLUMN participantes_eventos.nome IS 'Nome completo do participante';
COMMENT ON COLUMN participantes_eventos.cpf IS 'CPF do participante';
COMMENT ON COLUMN participantes_eventos.data_nascimento IS 'Data de nascimento do participante';
COMMENT ON COLUMN participantes_eventos.email IS 'Email do participante (opcional)';
COMMENT ON COLUMN participantes_eventos.genero IS 'Gênero do participante';

-- Índices para tabela de participantes de eventos
CREATE INDEX IF NOT EXISTS idx_participantes_eventos_inscricao_id ON participantes_eventos(inscricao_id);
CREATE INDEX IF NOT EXISTS idx_participantes_eventos_cpf ON participantes_eventos(cpf);
CREATE INDEX IF NOT EXISTS idx_participantes_eventos_nome ON participantes_eventos(nome);

-- ===============================================
-- TRIGGERS PARA NOVAS TABELAS
-- ===============================================

-- Trigger para atualizar updated_at em eventos
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em orientadores
CREATE TRIGGER update_orientadores_updated_at 
    BEFORE UPDATE ON orientadores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em modalidades
CREATE TRIGGER update_modalidades_updated_at 
    BEFORE UPDATE ON modalidades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em inscricoes_eventos
CREATE TRIGGER update_inscricoes_eventos_updated_at 
    BEFORE UPDATE ON inscricoes_eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em participantes_eventos
CREATE TRIGGER update_participantes_eventos_updated_at 
    BEFORE UPDATE ON participantes_eventos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- FUNÇÕES PARA EVENTOS
-- ===============================================

-- Função para atualizar vagas ocupadas em modalidades
CREATE OR REPLACE FUNCTION update_vagas_ocupadas_modalidade()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é uma nova inscrição aprovada
    IF TG_OP = 'INSERT' AND NEW.status = 'APROVADA' THEN
        UPDATE modalidades 
        SET vagas_ocupadas = vagas_ocupadas + (
            SELECT COUNT(*) FROM participantes_eventos 
            WHERE inscricao_id = NEW.id
        )
        WHERE id = NEW.modalidade_id;
    END IF;
    
    -- Se o status mudou para aprovada
    IF TG_OP = 'UPDATE' AND OLD.status != 'APROVADA' AND NEW.status = 'APROVADA' THEN
        UPDATE modalidades 
        SET vagas_ocupadas = vagas_ocupadas + (
            SELECT COUNT(*) FROM participantes_eventos 
            WHERE inscricao_id = NEW.id
        )
        WHERE id = NEW.modalidade_id;
    END IF;
    
    -- Se o status mudou de aprovada para outro
    IF TG_OP = 'UPDATE' AND OLD.status = 'APROVADA' AND NEW.status != 'APROVADA' THEN
        UPDATE modalidades 
        SET vagas_ocupadas = vagas_ocupadas - (
            SELECT COUNT(*) FROM participantes_eventos 
            WHERE inscricao_id = OLD.id
        )
        WHERE id = OLD.modalidade_id;
    END IF;
    
    -- Se a inscrição foi deletada e estava aprovada
    IF TG_OP = 'DELETE' AND OLD.status = 'APROVADA' THEN
        UPDATE modalidades 
        SET vagas_ocupadas = vagas_ocupadas - (
            SELECT COUNT(*) FROM participantes_eventos 
            WHERE inscricao_id = OLD.id
        )
        WHERE id = OLD.modalidade_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar vagas ocupadas
CREATE TRIGGER update_vagas_modalidade_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inscricoes_eventos
    FOR EACH ROW EXECUTE FUNCTION update_vagas_ocupadas_modalidade();

-- Função para verificar se há vagas disponíveis
CREATE OR REPLACE FUNCTION verificar_vagas_disponiveis(modalidade_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    limite INTEGER;
    ocupadas INTEGER;
BEGIN
    SELECT limite_vagas, vagas_ocupadas 
    INTO limite, ocupadas
    FROM modalidades 
    WHERE id = modalidade_uuid;
    
    RETURN (ocupadas < limite);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar se todas as tabelas de eventos foram criadas
DO $$
DECLARE
    eventos_count INTEGER;
    orientadores_count INTEGER;
    modalidades_count INTEGER;
    inscricoes_count INTEGER;
    participantes_count INTEGER;
BEGIN
    -- Verificar se as tabelas existem
    SELECT COUNT(*) INTO eventos_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'eventos';
    
    SELECT COUNT(*) INTO orientadores_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orientadores';
    
    SELECT COUNT(*) INTO modalidades_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modalidades';
    
    SELECT COUNT(*) INTO inscricoes_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inscricoes_eventos';
    
    SELECT COUNT(*) INTO participantes_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'participantes_eventos';
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'VERIFICAÇÃO DAS TABELAS DE EVENTOS';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '📅 eventos: %', CASE WHEN eventos_count > 0 THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
    RAISE NOTICE '👨‍🏫 orientadores: %', CASE WHEN orientadores_count > 0 THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
    RAISE NOTICE '🎯 modalidades: %', CASE WHEN modalidades_count > 0 THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
    RAISE NOTICE '📝 inscricoes_eventos: %', CASE WHEN inscricoes_count > 0 THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
    RAISE NOTICE '👥 participantes_eventos: %', CASE WHEN participantes_count > 0 THEN '✅ CRIADA' ELSE '❌ FALTANDO' END;
    
    IF eventos_count > 0 AND orientadores_count > 0 AND modalidades_count > 0 AND inscricoes_count > 0 AND participantes_count > 0 THEN
        RAISE NOTICE '🎉 TODAS AS TABELAS DE EVENTOS FORAM CRIADAS COM SUCESSO!';
        RAISE NOTICE '✅ O sistema de eventos está pronto para uso!';
    ELSE
        RAISE NOTICE '⚠️  ALGUMAS TABELAS NÃO FORAM CRIADAS. Verifique os erros acima.';
    END IF;
    
    RAISE NOTICE '===============================================';
END $$;

-- ===============================================
-- DADOS INICIAIS (OPCIONAL)
-- ===============================================

-- Inserir um evento de exemplo (opcional - descomente se necessário)
/*
INSERT INTO eventos (nome, descricao, data_inicio, data_fim, ativo) VALUES 
('MDX25 - Mermãs Digitais 2025', 'Evento principal das Mermãs Digitais para 2025', '2025-01-01 00:00:00+00', '2025-12-31 23:59:59+00', true)
ON CONFLICT DO NOTHING;
*/

RAISE NOTICE '===============================================';
RAISE NOTICE 'SCRIPT DE EVENTOS EXECUTADO COM SUCESSO!';
RAISE NOTICE '===============================================';
RAISE NOTICE '📊 Tabelas de eventos criadas: 5';
RAISE NOTICE '🔧 Funções e triggers configurados';
RAISE NOTICE '✅ Sistema de eventos pronto para sincronização!';
RAISE NOTICE '===============================================';

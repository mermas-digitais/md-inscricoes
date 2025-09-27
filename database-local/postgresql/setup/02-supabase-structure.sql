-- ===============================================
-- SCRIPT GERADO AUTOMATICAMENTE DO SUPABASE
-- ===============================================
-- Data de extração: 25/09/2025 20:34:54
-- Total de tabelas: 10
-- Método: Análise completa de estrutura e dados
-- Versão: Completa com índices e comentários (SEM DADOS)

-- ===============================================
-- EXTENSÕES NECESSÁRIAS
-- ===============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===============================================
-- CONFIGURAÇÕES INICIAIS
-- ===============================================
SET timezone = 'America/Sao_Paulo';

-- ===============================================
-- TABELAS
-- ===============================================

-- Tabela: inscricoes
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email CHARACTER VARYING NOT NULL,
  nome CHARACTER VARYING NOT NULL,
  cpf CHARACTER VARYING NOT NULL,
  data_nascimento DATE NOT NULL,
  cep CHARACTER VARYING NOT NULL,
  logradouro CHARACTER VARYING NOT NULL,
  numero CHARACTER VARYING NOT NULL,
  complemento CHARACTER VARYING,
  bairro CHARACTER VARYING NOT NULL,
  cidade CHARACTER VARYING NOT NULL,
  estado CHARACTER VARYING NOT NULL,
  nome_responsavel CHARACTER VARYING NOT NULL,
  telefone_whatsapp CHARACTER VARYING NOT NULL,
  escolaridade CHARACTER VARYING NOT NULL,
  ano_escolar CHARACTER VARYING NOT NULL,
  curso CHARACTER VARYING NOT NULL,
  status CHARACTER VARYING DEFAULT 'INSCRITA'::CHARACTER VARYING CHECK (status::text = ANY (ARRAY['INSCRITA'::character varying, 'MATRICULADA'::character varying, 'CANCELADA'::character varying, 'EXCEDENTE'::character varying]::text[])),
  documento_rg_cpf TEXT,
  documento_declaracao TEXT,
  documento_termo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  escola TEXT,
  CONSTRAINT inscricoes_pkey PRIMARY KEY (id)
);

-- Comentários para tabela de inscrições
COMMENT ON TABLE inscricoes IS 'Tabela principal de inscrições das Mermãs Digitais';
COMMENT ON COLUMN inscricoes.id IS 'Identificador único da inscrição';
COMMENT ON COLUMN inscricoes.email IS 'Email da aluna';
COMMENT ON COLUMN inscricoes.nome IS 'Nome completo da aluna';
COMMENT ON COLUMN inscricoes.cpf IS 'CPF da aluna';
COMMENT ON COLUMN inscricoes.status IS 'Status da inscrição: INSCRITA, MATRICULADA, CANCELADA, EXCEDENTE';

-- Índices para tabela de inscrições
CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf ON inscricoes(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_curso ON inscricoes(curso);
CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at ON inscricoes(created_at);

-- Tabela: monitores
CREATE TABLE IF NOT EXISTS monitores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  role CHARACTER VARYING DEFAULT 'MONITOR'::CHARACTER VARYING CHECK (role::text = ANY (ARRAY['MONITOR'::character varying, 'ADM'::character varying]::text[])),
  CONSTRAINT monitores_pkey PRIMARY KEY (id)
);

-- Comentários para tabela de monitores
COMMENT ON TABLE monitores IS 'Tabela de monitores e administradores';
COMMENT ON COLUMN monitores.role IS 'Papel do usuário: MONITOR ou ADM';

-- Índices para tabela de monitores
CREATE INDEX IF NOT EXISTS idx_monitores_email ON monitores(email);
CREATE INDEX IF NOT EXISTS idx_monitores_role ON monitores(role);

-- Sequência para escolas
CREATE SEQUENCE IF NOT EXISTS escolas_id_seq;

-- Tabela: escolas
CREATE TABLE IF NOT EXISTS escolas (
  id INTEGER NOT NULL DEFAULT nextval('escolas_id_seq'::regclass),
  nome TEXT NOT NULL UNIQUE,
  rede TEXT NOT NULL CHECK (rede = ANY (ARRAY['municipal'::text, 'estadual'::text, 'federal'::text, 'particular'::text])),
  publica BOOLEAN NOT NULL,
  uf TEXT NOT NULL,
  municipio TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT escolas_pkey PRIMARY KEY (id)
);

-- Comentários para tabela de escolas
COMMENT ON TABLE escolas IS 'Tabela de escolas com nova estrutura';
COMMENT ON COLUMN escolas.rede IS 'Rede da escola: municipal, estadual, federal, particular';
COMMENT ON COLUMN escolas.publica IS 'Se a escola é pública (true) ou particular (false)';
COMMENT ON COLUMN escolas.uf IS 'Unidade Federativa (UF)';
COMMENT ON COLUMN escolas.municipio IS 'Nome do município';

-- Índices para tabela de escolas
CREATE INDEX IF NOT EXISTS idx_escolas_nome ON escolas USING GIN (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_escolas_rede ON escolas(rede);
CREATE INDEX IF NOT EXISTS idx_escolas_publica ON escolas(publica);
CREATE INDEX IF NOT EXISTS idx_escolas_uf ON escolas(uf);
CREATE INDEX IF NOT EXISTS idx_escolas_municipio ON escolas(municipio);

-- Tabela: verification_codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email CHARACTER VARYING NOT NULL,
  code CHARACTER VARYING NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT verification_codes_pkey PRIMARY KEY (id)
);

-- Comentários para tabela de códigos de verificação
COMMENT ON TABLE verification_codes IS 'Códigos de verificação por email';

-- Índices para tabela de códigos de verificação
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);

-- Tabela: cursos
CREATE TABLE IF NOT EXISTS cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nome_curso TEXT NOT NULL,
  descricao TEXT,
  carga_horaria INTEGER,
  publico_alvo TEXT CHECK (publico_alvo = ANY (ARRAY['Ensino Fundamental 2'::text, 'Ensino Médio'::text])),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ATIVO'::text CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text])),
  projeto TEXT NOT NULL DEFAULT 'Mermãs Digitais'::text CHECK (projeto = ANY (ARRAY['Meninas STEM'::text, 'Mermãs Digitais'::text])),
  CONSTRAINT cursos_pkey PRIMARY KEY (id)
);

-- Tabela: turmas
CREATE TABLE IF NOT EXISTS turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL,
  codigo_turma TEXT NOT NULL,
  ano_letivo INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planejamento'::text CHECK (status = ANY (ARRAY['Planejamento'::text, 'Ativa'::text, 'Concluída'::text, 'Cancelada'::text])),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descricao TEXT,
  semestre INTEGER NOT NULL DEFAULT 1 CHECK (semestre = ANY (ARRAY[1, 2])),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT turmas_pkey PRIMARY KEY (id),
  CONSTRAINT turmas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Tabela: turmas_monitores
CREATE TABLE IF NOT EXISTS turmas_monitores (
  turma_id UUID NOT NULL,
  monitor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT turmas_monitores_pkey PRIMARY KEY (turma_id, monitor_id),
  CONSTRAINT turmas_monitores_monitor_id_fkey FOREIGN KEY (monitor_id) REFERENCES monitores(id),
  CONSTRAINT turmas_monitores_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

-- Tabela: turmas_alunas
CREATE TABLE IF NOT EXISTS turmas_alunas (
  turma_id UUID NOT NULL,
  aluna_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT turmas_alunas_pkey PRIMARY KEY (turma_id, aluna_id),
  CONSTRAINT turmas_alunas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES turmas(id),
  CONSTRAINT turmas_alunas_aluna_id_fkey FOREIGN KEY (aluna_id) REFERENCES inscricoes(id)
);

-- Tabela: aulas
CREATE TABLE IF NOT EXISTS aulas (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL,
  data_aula DATE,
  conteudo_ministrado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modulo_id UUID,
  nome_aula TEXT,
  ordem INTEGER,
  status TEXT NOT NULL DEFAULT 'bloqueada'::text CHECK (status = ANY (ARRAY['bloqueada'::text, 'desbloqueada'::text])),
  CONSTRAINT aulas_pkey PRIMARY KEY (id),
  CONSTRAINT aulas_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

-- Tabela: frequencia
CREATE TABLE IF NOT EXISTS frequencia (
  aula_id UUID NOT NULL,
  aluna_id UUID NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT frequencia_pkey PRIMARY KEY (aula_id, aluna_id),
  CONSTRAINT frequencia_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES aulas(id),
  CONSTRAINT frequencia_aluna_id_fkey FOREIGN KEY (aluna_id) REFERENCES inscricoes(id)
);

-- Tabela: modulos
CREATE TABLE IF NOT EXISTS modulos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL,
  nome_modulo TEXT NOT NULL,
  descricao TEXT,
  quantidade_aulas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT modulos_pkey PRIMARY KEY (id),
  CONSTRAINT modulos_turma_id_fkey FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

-- Tabela: materiais_aula
CREATE TABLE IF NOT EXISTS materiais_aula (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL,
  nome_material TEXT NOT NULL,
  descricao TEXT,
  tipo_material TEXT NOT NULL CHECK (tipo_material = ANY (ARRAY['link'::text, 'arquivo'::text, 'video'::text])),
  url_material TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT materiais_aula_pkey PRIMARY KEY (id),
  CONSTRAINT materiais_aula_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES aulas(id)
);

-- Adicionar constraint de módulo nas aulas
ALTER TABLE aulas ADD CONSTRAINT IF NOT EXISTS aulas_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES modulos(id);

-- ===============================================
-- FUNÇÕES AUXILIARES
-- ===============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar códigos de verificação expirados
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS
-- ===============================================

-- Trigger para atualizar updated_at em inscricoes
CREATE TRIGGER update_inscricoes_updated_at 
    BEFORE UPDATE ON inscricoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em monitores
CREATE TRIGGER update_monitores_updated_at 
    BEFORE UPDATE ON monitores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE 'Total de tabelas criadas: %', table_count;
    
         IF table_count >= 17 THEN
             RAISE NOTICE '✅ ESTRUTURA COMPLETA CRIADA COM SUCESSO!';
             RAISE NOTICE '📊 Tabelas do sistema original: 12';
             RAISE NOTICE '🎯 Tabelas para eventos: 5';
             RAISE NOTICE '🎉 TOTAL: % tabelas', table_count;
         ELSE
             RAISE NOTICE '⚠️  ATENÇÃO: Poucas tabelas foram criadas.';
             RAISE NOTICE 'Esperado: 17+ tabelas, Encontrado: %', table_count;
         END IF;
END $$;

RAISE NOTICE '===============================================';
RAISE NOTICE 'EXTRAÇÃO COMPLETA FINALIZADA!';
RAISE NOTICE '===============================================';

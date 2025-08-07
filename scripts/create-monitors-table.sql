-- Criar tabela de monitores
CREATE TABLE IF NOT EXISTS monitores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  curso_responsavel VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alguns monitores de exemplo
INSERT INTO monitores (nome, email, curso_responsavel) VALUES
  ('Ana Silva', 'ana.silva@mermasdigitais.com', 'Desenvolvimento de Jogos'),
  ('Maria Santos', 'maria.santos@mermasdigitais.com', 'Robótica e Automação'),
  ('João Costa', 'joao.costa@mermasdigitais.com', 'Programação Web'),
  ('Carla Lima', 'carla.lima@mermasdigitais.com', 'Design Gráfico'),
  ('Pedro Oliveira', 'pedro.oliveira@mermasdigitais.com', 'Marketing Digital');

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_monitores_email ON monitores(email);

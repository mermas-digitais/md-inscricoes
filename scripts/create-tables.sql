-- Create the inscricoes table
CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  data_nascimento DATE NOT NULL,
  cep VARCHAR(9) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  nome_responsavel VARCHAR(255) NOT NULL,
  telefone_whatsapp VARCHAR(15) NOT NULL,
  escolaridade VARCHAR(50) NOT NULL,
  ano_escolar VARCHAR(10) NOT NULL,
  curso VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'INSCRITA' CHECK (status IN ('INSCRITA', 'MATRICULADA', 'CANCELADA')),
  documento_rg_cpf TEXT,
  documento_declaracao TEXT,
  documento_termo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cpf ON inscricoes(cpf);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_curso ON inscricoes(curso);
CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at ON inscricoes(created_at);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to do everything
CREATE POLICY "Service role can do everything" ON inscricoes
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for storage bucket
CREATE POLICY "Public can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');

CREATE POLICY "Service role can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'service_role');

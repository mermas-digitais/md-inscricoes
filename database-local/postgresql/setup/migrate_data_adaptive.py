#!/usr/bin/env python3
"""
Script adaptativo para migrar dados do Supabase para PostgreSQL local
Detecta automaticamente a estrutura real das tabelas e adapta
"""

import os
import sys
import json
from datetime import datetime
from supabase import create_client, Client
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_supabase_client() -> Client:
    """Criar cliente Supabase"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Erro: Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env")
        sys.exit(1)
    
    return create_client(url, key)

def get_postgres_connection():
    """Criar conexão com PostgreSQL local"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="mermas_digitais_db",
            user="postgres",
            password="mermas123"
        )
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar com PostgreSQL: {e}")
        sys.exit(1)

def get_table_columns(pg_conn, table_name: str):
    """Obter colunas da tabela PostgreSQL"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = {}
        for row in cursor.fetchall():
            columns[row[0]] = {
                'type': row[1],
                'nullable': row[2] == 'YES',
                'default': row[3]
            }
        cursor.close()
        return columns
    except Exception as e:
        print(f"   ❌ Erro ao obter colunas de {table_name}: {e}")
        return {}

def adapt_data_to_schema(supabase_data: list, pg_columns: dict):
    """Adaptar dados do Supabase para o schema PostgreSQL"""
    adapted_data = []
    
    for row in supabase_data:
        adapted_row = {}
        
        for supabase_key, supabase_value in row.items():
            # Verificar se a coluna existe no PostgreSQL
            if supabase_key in pg_columns:
                # Adaptar valor se necessário
                if supabase_value is None and not pg_columns[supabase_key]['nullable']:
                    # Se não é nullable, usar valor padrão ou string vazia
                    if pg_columns[supabase_key]['default']:
                        adapted_row[supabase_key] = pg_columns[supabase_key]['default']
                    else:
                        adapted_row[supabase_key] = ''
                else:
                    adapted_row[supabase_key] = supabase_value
            else:
                # Coluna não existe no PostgreSQL, pular
                print(f"   ⚠️  Coluna '{supabase_key}' não existe no PostgreSQL, pulando...")
        
        adapted_data.append(adapted_row)
    
    return adapted_data

def migrate_table_data_adaptive(supabase: Client, pg_conn, table_name: str):
    """Migrar dados de uma tabela específica com adaptação automática"""
    print(f"📊 Migrando tabela: {table_name}")
    
    try:
        # Buscar todos os dados do Supabase
        result = supabase.table(table_name).select("*").execute()
        data = result.data if result.data else []
        
        if not data:
            print(f"   ⚠️  Tabela {table_name} está vazia no Supabase")
            return 0
        
        print(f"   📥 Encontrados {len(data)} registros no Supabase")
        
        # Obter estrutura da tabela PostgreSQL
        pg_columns = get_table_columns(pg_conn, table_name)
        if not pg_columns:
            print(f"   ❌ Não foi possível obter estrutura da tabela {table_name}")
            return 0
        
        print(f"   🔍 Colunas PostgreSQL: {list(pg_columns.keys())}")
        
        # Adaptar dados
        adapted_data = adapt_data_to_schema(data, pg_columns)
        
        if not adapted_data:
            print(f"   ⚠️  Nenhum dado adaptado para {table_name}")
            return 0
        
        # Preparar cursor
        cursor = pg_conn.cursor()
        
        # Limpar tabela local primeiro
        cursor.execute(f"DELETE FROM {table_name}")
        print(f"   🧹 Tabela {table_name} limpa")
        
        # Inserir dados adaptados
        inserted_count = 0
        for row in adapted_data:
            try:
                # Preparar colunas e valores
                columns = list(row.keys())
                values = list(row.values())
                placeholders = ', '.join(['%s'] * len(values))
                
                # Query de inserção
                query = f"""
                INSERT INTO {table_name} ({', '.join(columns)}) 
                VALUES ({placeholders})
                """
                
                cursor.execute(query, values)
                inserted_count += 1
                
            except Exception as e:
                print(f"   ⚠️  Erro ao inserir registro: {e}")
                continue
        
        # Commit das alterações
        pg_conn.commit()
        cursor.close()
        
        print(f"   ✅ {inserted_count} registros inseridos com sucesso")
        return inserted_count
        
    except Exception as e:
        print(f"   ❌ Erro ao migrar {table_name}: {e}")
        pg_conn.rollback()
        return 0

def verify_migration(pg_conn, table_name: str):
    """Verificar se a migração foi bem-sucedida"""
    try:
        cursor = pg_conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    except Exception as e:
        print(f"   ❌ Erro ao verificar {table_name}: {e}")
        return 0

def main():
    """Função principal"""
    print("🚀 Iniciando migração ADAPTATIVA de dados do Supabase para PostgreSQL...")
    print("=" * 70)
    
    # Lista de tabelas para migrar (apenas as do sistema original)
    tables_to_migrate = [
        'inscricoes',
        'monitores', 
        'escolas',
        'verification_codes',
        'cursos',
        'turmas',
        'turmas_monitores',
        'turmas_alunas',
        'aulas',
        'frequencia'
    ]
    
    # Criar clientes
    supabase = get_supabase_client()
    pg_conn = get_postgres_connection()
    
    print("✅ Conexões estabelecidas com sucesso!")
    print(f"📊 Migrando {len(tables_to_migrate)} tabelas com adaptação automática...")
    print()
    
    # Estatísticas
    total_records = 0
    successful_tables = 0
    failed_tables = []
    
    # Migrar cada tabela
    for table_name in tables_to_migrate:
        try:
            records_migrated = migrate_table_data_adaptive(supabase, pg_conn, table_name)
            
            if records_migrated > 0:
                # Verificar migração
                local_count = verify_migration(pg_conn, table_name)
                if local_count == records_migrated:
                    print(f"   ✅ Verificação OK: {local_count} registros")
                    successful_tables += 1
                    total_records += records_migrated
                else:
                    print(f"   ⚠️  Verificação falhou: esperado {records_migrated}, encontrado {local_count}")
                    failed_tables.append(table_name)
            else:
                failed_tables.append(table_name)
                
        except Exception as e:
            print(f"   ❌ Erro crítico na tabela {table_name}: {e}")
            failed_tables.append(table_name)
        
        print()
    
    # Fechar conexão
    pg_conn.close()
    
    # Relatório final
    print("=" * 70)
    print("📊 RELATÓRIO FINAL DA MIGRAÇÃO ADAPTATIVA")
    print("=" * 70)
    print(f"✅ Tabelas migradas com sucesso: {successful_tables}/{len(tables_to_migrate)}")
    print(f"📝 Total de registros migrados: {total_records}")
    
    if failed_tables:
        print(f"❌ Tabelas com problemas: {', '.join(failed_tables)}")
    else:
        print("🎉 Todas as tabelas foram migradas com sucesso!")
    
    print()
    print("🔍 Para verificar os dados:")
    print("   docker exec -it mermas_digitais_db psql -U postgres -d mermas_digitais_db")
    print("   \\dt  -- listar tabelas")
    print("   SELECT COUNT(*) FROM inscricoes;  -- verificar registros")
    print()
    print("🎯 Migração adaptativa concluída!")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Script de scraping que salva dados em ambos os bancos:
- Supabase (produção)
- PostgreSQL local (desenvolvimento)
"""

import sys
import requests
import json
import re
import time
from bs4 import BeautifulSoup
from supabase import create_client, Client
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuração do Supabase
SUPABASE_URL = "https://yibtbjjamezyxbepdnnw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYnRiamphbWV6eXhiZXBkbm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDQ4NTksImV4cCI6MjA2OTkyMDg1OX0.6YCBOqqGmvBcCQLuwu3JMQP_GLysO-972_w4zKxa5nY"

# Configuração do PostgreSQL local
LOCAL_DB_CONFIG = {
    'host': 'host.docker.internal',  # Para acessar o host do Docker
    'port': '5432',
    'database': 'mermas_digitais_db',
    'user': 'postgres',
    'password': 'mermas123'  # Senha correta do banco local
}

def extract_school_data(html_content, is_public, rede_type):
    """Extrair dados das escolas do HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    all_schools = []

    # Encontrar a lista de escolas
    schools_list = soup.find('ul', class_='schools_list')
    if not schools_list:
        return all_schools

    # Iterar sobre cada escola
    for li in schools_list.find_all('li'):
        try:
            # Nome da escola
            name_tag = li.find('h2')
            if not name_tag:
                continue
            
            name_link = name_tag.find('a')
            if not name_link:
                continue
                
            name = name_link.text.strip()

            # Município
            p_tag = li.find('p')
            municipio = ""
            if p_tag:
                # Remover conteúdo SVG e extrair apenas o texto
                for svg in p_tag.find_all('svg'):
                    svg.decompose()
                
                location_text = p_tag.get_text(strip=True)
                # Extrair município do texto (formato: "Cidade, Estado")
                parts = location_text.split(',')
                if len(parts) >= 2:
                    municipio = parts[0].strip()

            if not name or not municipio:
                continue

            school_data = {
                "nome": name,
                "rede": rede_type,
                "publica": is_public,
                "uf": "MA",
                "municipio": municipio
            }
            all_schools.append(school_data)
            
        except Exception as e:
            print(f"⚠️  Erro ao processar escola: {e}")
            continue

    return all_schools

def scrape_all_pages(base_url, is_public, rede_type, max_pages=50):
    """Scraping de todas as páginas de um tipo de escola"""
    all_schools_data = []
    page = 1
    
    print(f"🔍 Iniciando scraping de escolas {rede_type}...")
    
    while page <= max_pages:
        current_url = f"{base_url}?pagina={page}"
        print(f"📄 Scraping página {page}: {current_url}")
        
        try:
            response = requests.get(current_url, timeout=30)
            response.raise_for_status()
            
            schools_on_page = extract_school_data(response.content, is_public, rede_type)
            
            if not schools_on_page:
                print(f"🏁 Página {page} vazia - fim do scraping")
                break
                
            all_schools_data.extend(schools_on_page)
            print(f"✅ Página {page}: {len(schools_on_page)} escolas encontradas")
            
            # Delay entre requisições
            time.sleep(1)
            page += 1
            
        except requests.RequestException as e:
            print(f"❌ Erro na página {page}: {e}")
            break
        except Exception as e:
            print(f"❌ Erro geral na página {page}: {e}")
            break
    
    print(f"📊 Total de escolas {rede_type} encontradas: {len(all_schools_data)}")
    return all_schools_data

def save_to_supabase(schools, school_type):
    """Salvar escolas no Supabase"""
    print(f"📡 Salvando {len(schools)} escolas {school_type} no Supabase...")
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        success_count = 0
        error_count = 0
        
        for school in schools:
            try:
                # Remove 'id' se existir (auto-gerado)
                school_to_insert = {k: v for k, v in school.items() if k != 'id'}
                
                response = supabase.table('escolas').insert(school_to_insert).execute()
                
                if response.data:
                    success_count += 1
                    if success_count % 50 == 0:  # Log a cada 50 inserções
                        print(f"   ✅ {success_count} escolas salvas...")
                else:
                    error_count += 1
                    print(f"   ❌ Erro ao inserir {school['nome']}: {response.error}")
                    
            except Exception as e:
                error_count += 1
                print(f"   ❌ Erro ao inserir {school['nome']}: {e}")
        
        print(f"✅ Supabase: {success_count} escolas salvas, {error_count} erros")
        return success_count, error_count
        
    except Exception as e:
        print(f"❌ Erro geral no Supabase: {e}")
        return 0, len(schools)

def save_to_local_db(schools, school_type):
    """Salvar escolas no PostgreSQL local"""
    print(f"💾 Salvando {len(schools)} escolas {school_type} no PostgreSQL local...")
    
    try:
        conn = psycopg2.connect(**LOCAL_DB_CONFIG)
        cursor = conn.cursor()
        
        success_count = 0
        error_count = 0
        
        for school in schools:
            try:
                cursor.execute("""
                    INSERT INTO escolas (nome, rede, publica, uf, municipio)
                    VALUES (%(nome)s, %(rede)s, %(publica)s, %(uf)s, %(municipio)s)
                    ON CONFLICT (nome, municipio, uf) DO NOTHING
                """, school)
                
                if cursor.rowcount > 0:
                    success_count += 1
                else:
                    # Registro já existe (não é erro)
                    pass
                    
            except Exception as e:
                error_count += 1
                print(f"   ❌ Erro ao inserir {school['nome']}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ PostgreSQL Local: {success_count} escolas salvas, {error_count} erros")
        return success_count, error_count
        
    except Exception as e:
        print(f"❌ Erro geral no PostgreSQL local: {e}")
        return 0, len(schools)

def main():
    """Função principal"""
    print("🚀 Iniciando scraping completo de escolas do Maranhão...")
    print("📡 Salvando em Supabase (produção) e PostgreSQL local (desenvolvimento)")
    
    # URLs para scraping
    urls_to_scrape = [
        {"url": "https://escolas.com.br/particulares/ma", "publica": False, "rede": "particular"},
        {"url": "https://escolas.com.br/estaduais/ma", "publica": True, "rede": "estadual"},
        {"url": "https://escolas.com.br/federais/ma", "publica": True, "rede": "federal"},
        {"url": "https://escolas.com.br/municipais/ma", "publica": True, "rede": "municipal"}
    ]
    
    total_supabase_success = 0
    total_supabase_errors = 0
    total_local_success = 0
    total_local_errors = 0
    
    for school_type_data in urls_to_scrape:
        print(f"\n{'='*60}")
        print(f"🎯 Processando escolas {school_type_data['rede']}")
        print(f"{'='*60}")
        
        # Scraping
        schools = scrape_all_pages(
            school_type_data['url'], 
            school_type_data['publica'], 
            school_type_data['rede']
        )
        
        if not schools:
            print(f"⚠️  Nenhuma escola {school_type_data['rede']} encontrada")
            continue
        
        # Salvar no Supabase
        supabase_success, supabase_errors = save_to_supabase(schools, school_type_data['rede'])
        total_supabase_success += supabase_success
        total_supabase_errors += supabase_errors
        
        # Salvar no PostgreSQL local
        local_success, local_errors = save_to_local_db(schools, school_type_data['rede'])
        total_local_success += local_success
        total_local_errors += local_errors
        
        # Backup local
        backup_filename = f"backup-{school_type_data['rede']}-complete.json"
        with open(backup_filename, "w", encoding="utf-8") as f:
            json.dump(schools, f, ensure_ascii=False, indent=2)
        print(f"💾 Backup salvo em: {backup_filename}")
    
    # Resumo final
    print(f"\n{'='*60}")
    print("🎉 SCRAPING COMPLETO!")
    print(f"{'='*60}")
    print(f"📊 RESUMO FINAL:")
    print(f"   Supabase: {total_supabase_success} sucessos, {total_supabase_errors} erros")
    print(f"   PostgreSQL Local: {total_local_success} sucessos, {total_local_errors} erros")
    print(f"   Total processado: {total_supabase_success + total_local_success} escolas")

if __name__ == "__main__":
    main()

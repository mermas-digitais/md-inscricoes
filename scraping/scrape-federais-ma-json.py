#!/usr/bin/env python3
"""
Script para fazer scraping das escolas federais do Maranhão
e salvar em arquivo JSON
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import re
from datetime import datetime

def clean_text(text):
    """Limpar texto removendo espaços extras e caracteres especiais"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.strip())

def scrape_federais_ma():
    """Fazer scraping das escolas federais do Maranhão"""
    print("[INFO] Iniciando scraping das escolas federais do Maranhão...")
    
    url = "https://escolas.com.br/federais/ma/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Encontrar a lista de escolas
        schools_list = soup.find('ul', class_='schools_list')
        if not schools_list:
            print("[ERROR] Lista de escolas não encontrada")
            return []
        
        schools = []
        school_items = schools_list.find_all('li')
        
        print(f"[INFO] Encontradas {len(school_items)} escolas federais")
        
        for item in school_items:
            try:
                # Extrair nome da escola
                name_element = item.find('h2')
                if not name_element:
                    continue
                    
                name_link = name_element.find('a')
                if not name_link:
                    continue
                    
                school_name = clean_text(name_link.get_text())
                
                # Extrair município
                municipality_element = item.find('p')
                municipality = ""
                if municipality_element:
                    municipality = clean_text(municipality_element.get_text())
                
                if school_name and municipality:
                    school_data = {
                        'nome': school_name,
                        'rede': 'federal',
                        'publica': True,
                        'uf': 'MA',
                        'municipio': municipality,
                        'scraped_at': datetime.now().isoformat()
                    }
                    schools.append(school_data)
                    print(f"[OK] {school_name} - {municipality}")
                
            except Exception as e:
                print(f"[ERROR] Erro ao processar item: {e}")
                continue
        
        return schools
        
    except requests.RequestException as e:
        print(f"[ERROR] Erro na requisição: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] Erro geral: {e}")
        return []

def save_to_json(schools, filename="escolas_federais_ma.json"):
    """Salvar escolas em arquivo JSON"""
    if not schools:
        print("[ERROR] Nenhuma escola para salvar")
        return
    
    print(f"[INFO] Salvando {len(schools)} escolas em {filename}...")
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(schools, f, ensure_ascii=False, indent=2)
        
        print(f"[SUCCESS] {len(schools)} escolas salvas em {filename}")
        
        # Mostrar estatísticas
        print(f"\n[STATS] Estatísticas:")
        print(f"  - Total de escolas: {len(schools)}")
        print(f"  - Rede: federal")
        print(f"  - UF: MA")
        print(f"  - Públicas: {sum(1 for s in schools if s['publica'])}")
        
        # Mostrar municípios únicos
        municipios = set(s['municipio'] for s in schools)
        print(f"  - Municípios: {len(municipios)}")
        print(f"  - Lista de municípios: {', '.join(sorted(municipios))}")
        
    except Exception as e:
        print(f"[ERROR] Erro ao salvar arquivo: {e}")

def main():
    """Função principal"""
    print("[START] Iniciando scraping de escolas federais do Maranhão")
    print("=" * 60)
    
    # Fazer scraping
    schools = scrape_federais_ma()
    
    if schools:
        print(f"\n[INFO] Total de escolas encontradas: {len(schools)}")
        
        # Salvar em JSON
        save_to_json(schools)
    else:
        print("[ERROR] Nenhuma escola encontrada")
    
    print("\n[END] Scraping finalizado!")

if __name__ == "__main__":
    main()

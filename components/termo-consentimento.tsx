"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TermoConsentimentoProps {
  nomeResponsavel?: string;
  cpfResponsavel?: string;
  nomeParticipante?: string;
}

export function TermoConsentimento({
  nomeResponsavel = "",
  cpfResponsavel = "",
  nomeParticipante = "",
}: TermoConsentimentoProps) {
  const generatePDF = () => {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString("pt-BR");

    // Função para criar campos preenchidos ou vazios
    const criarCampo = (valor: string, tamanhoDefault: number = 40) => {
      return valor ? valor : "_".repeat(tamanhoDefault);
    };

    // Criar o conteúdo HTML do PDF
    const conteudoPDF = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termo de Consentimento - Mermãs Digitais</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: 'Poppins', sans-serif;
            line-height: 2.0;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
            color: #000;
            background: white;
            font-size: 14px;
          }
          @media (min-width: 768px) {
            body {
              max-width: 800px;
              padding: 40px;
            }
          }
          .header-info {
            text-align: center;
            margin-bottom: 40px;
            font-size: 12px;
            color: #666;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 50px;
            text-align: center;
            letter-spacing: 0.5px;
            line-height: 1.4;
          }
          .content {
            text-align: justify;
            margin-bottom: 30px;
            font-size: 14px;
            line-height: 2.2;
          }
          .field {
            font-weight: bold;
            border: none;
            border-bottom: 1px solid #000;
            background: transparent;
            padding: 2px 5px;
            min-width: 150px;
            max-width: 100%;
            display: inline-block;
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .field:focus {
            outline: none;
            background: #f0f0f0;
            border-bottom: 2px solid #9854CB;
          }
          .field-small {
            font-weight: bold;
            border: none;
            border-bottom: 1px solid #000;
            background: transparent;
            padding: 2px 5px;
            min-width: 120px;
            max-width: 100%;
            display: inline-block;
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .field-small:focus {
            outline: none;
            background: #f0f0f0;
            border-bottom: 2px solid #9854CB;
          }
          @media print {
            .field, .field-small {
              border-bottom: 1px solid #000 !important;
              background: transparent !important;
            }
          }
          .signature-area {
            margin-top: 80px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #000;
            width: 400px;
            margin: 60px auto 0;
            padding-top: 8px;
            font-size: 12px;
            text-align: center;
          }
          .date-location {
            margin-top: 60px;
            margin-bottom: 20px;
            text-align: left;
            font-size: 14px;
          }
          .date-field {
            text-decoration: underline;
            text-decoration-style: solid;
            text-underline-offset: 3px;
            min-width: 150px;
            padding: 0 5px;
            display: inline-block;
            font-weight: bold;
            text-align: center;
          }
          .print-button {
            background: linear-gradient(135deg, #9854CB, #7e3ba3);
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(152, 84, 203, 0.3);
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
          }
          .print-button:hover {
            background: linear-gradient(135deg, #7e3ba3, #6a2d8a);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(152, 84, 203, 0.4);
          }
          .logo-area {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            border-bottom: 2px solid #9854CB;
          }
          .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .logo-title {
            font-size: 20px;
            font-weight: bold;
            color: #9854CB;
            margin-bottom: 5px;
          }
          .logo-subtitle {
            font-size: 12px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="logo-area no-print">
          <img src="/assets/images/md_logo.svg" alt="Mermãs Digitais" class="logo" style="width: 120px; height: auto; margin-bottom: 15px;">
          <div class="logo-title">PROJETO MERMÃS DIGITAIS</div>
          <div class="logo-subtitle">Capacitando meninas em tecnologia</div>
        </div>
        
        <div class="title">
          TERMO DE CIÊNCIA E AUTORIZAÇÃO PARA PARTICIPAÇÃO<br>
          NO PROJETO MERMÃS DIGITAIS
        </div>
        
        <div class="content">
          Eu, <input type="text" class="field" value="${nomeResponsavel}" placeholder="Nome completo do responsável" style="width: 100%; min-width: 200px; max-width: 100%; display: block; margin: 10px 0;">, inscrito(a) no CPF <input type="text" class="field-small" value="${cpfResponsavel}" placeholder="000.000.000-00" maxlength="14" style="width: 100%; min-width: 150px; max-width: 100%; display: block; margin: 10px 0;">, responsável legal pela participante <input type="text" class="field" value="${nomeParticipante}" readonly style="background: #f9f9f9; width: 100%; min-width: 200px; max-width: 100%; display: block; margin: 10px 0;">,<br>
          declaro que estou ciente e autorizo a participação de minha filha/menor sob minha guarda no projeto Mermãs Digitais, que oferece oficinas e atividades educacionais na área de tecnologia e robótica.
        </div>
        
        <div class="content">
          Entendo que as atividades e oficinas oferecidas pelo projeto são voltadas ao desenvolvimento acadêmico e pessoal da participante, sendo conduzidas em ambiente seguro, presencial e supervisionado pela equipe organizadora.
        </div>
        
        <div class="content">
          Declaro ainda que fui devidamente informado(a) sobre o conteúdo das atividades e que assumo total responsabilidade pela autorização aqui concedida, autorizando também o registro de imagens e vídeos da participação de minha filha/menor para fins de divulgação institucional, sem fins lucrativos.
        </div>
        
        <div class="content">
          Por meio deste documento, confirmo que estou ciente e concordo com as condições estabelecidas pelo projeto Mermãs Digitais para a participação de minha filha/menor.
        </div>
        
        <div class="date-location">
          Imperatriz - MA, <span class="date-field">${dataFormatada}</span>
        </div>
        
        <div class="signature-area">
          <div class="signature-line">
            Assinatura do(a) Responsável Legal
          </div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 50px; padding: 40px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 16px; border: 2px solid #9854CB; box-shadow: 0 8px 32px rgba(152, 84, 203, 0.1);">
          <div style="margin-bottom: 25px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #9854CB, #7e3ba3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 4px 12px rgba(152, 84, 203, 0.3);">
              <span style="font-size: 24px;">🖨️</span>
            </div>
            <h3 style="font-size: 18px; font-weight: 600; color: #330043; margin: 0 0 8px 0;">Instruções de Impressão</h3>
            <p style="font-size: 14px; color: #666; margin: 0; font-weight: 400;">Siga os passos abaixo para gerar seu documento</p>
          </div>
          
          <button class="print-button" onclick="window.print()" style="background: linear-gradient(135deg, #9854CB, #7e3ba3); color: white; padding: 16px 32px; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 16px rgba(152, 84, 203, 0.3); transition: all 0.3s ease; font-family: 'Poppins', sans-serif;">
            🖨️ Imprimir Documento
          </button>
          
          <div style="background: white; border-radius: 12px; padding: 25px; margin-top: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); border: 1px solid #e9ecef;">
            <h4 style="font-size: 16px; font-weight: 600; color: #330043; margin: 0 0 20px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #9854CB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">1</span>
              Preencha os campos editáveis
            </h4>
            <h4 style="font-size: 16px; font-weight: 600; color: #330043; margin: 0 0 20px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #9854CB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">2</span>
              Clique em "Imprimir" quando estiver correto
            </h4>
            <h4 style="font-size: 16px; font-weight: 600; color: #330043; margin: 0 0 20px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #9854CB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">3</span>
              Assine o documento impresso
            </h4>
            <h4 style="font-size: 16px; font-weight: 600; color: #330043; margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="width: 20px; height: 20px; background: #9854CB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">4</span>
              Traga no primeiro dia de aula
            </h4>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #e8f5e8, #d4edda); border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="font-size: 13px; color: #155724; margin: 0; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="font-size: 16px;">✅</span>
              Documento oficial do projeto Mermãs Digitais
            </p>
          </div>
        </div>
        
        <script>
          // Formatação automática do CPF
          document.addEventListener('DOMContentLoaded', function() {
            const cpfInput = document.querySelector('input[maxlength="14"]');
            if (cpfInput) {
              cpfInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\\D/g, '');
                if (value.length <= 11) {
                  value = value.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
                  e.target.value = value;
                }
              });
            }
            
            // Foco automático no primeiro campo vazio
            const firstEmptyField = document.querySelector('input[value=""]:not([readonly])');
            if (firstEmptyField) {
              firstEmptyField.focus();
            }
          });
        </script>
      </body>
      </html>
    `;

    // Abrir em nova aba para impressão
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(conteudoPDF);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 mb-2 text-base sm:text-lg">
            📄 Termo de Consentimento
          </h4>
          <p className="text-xs sm:text-sm text-blue-700 mb-3 sm:mb-4 leading-relaxed">
            {nomeResponsavel ? (
              <>
                Termo com campos editáveis no navegador. Dados de{" "}
                <strong className="break-words">{nomeResponsavel}</strong> e da
                aluna{" "}
                <strong className="break-words">{nomeParticipante}</strong> já
                preenchidos. Você pode editar diretamente no documento, depois
                imprimir, assinar e trazer no primeiro dia de aula.
              </>
            ) : (
              <>
                Termo com campos editáveis no navegador. Nome da aluna{" "}
                <strong className="break-words">{nomeParticipante}</strong> já
                preenchido. Preencha os dados do responsável diretamente no
                documento, imprima, assine e trazer no primeiro dia de aula.
              </>
            )}
          </p>
          <Button
            onClick={generatePDF}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">
              Abrir Termo de Consentimento
            </span>
            <span className="sm:hidden">Abrir Termo</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

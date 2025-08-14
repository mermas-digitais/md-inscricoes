import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EscolaSelector from "@/components/ui/escola-selector";
import {
  FileDown,
  FileSpreadsheet,
  Download,
  Filter,
  X,
  FileText,
  Users,
  School,
  Calendar,
  BookOpen,
  GraduationCap,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  data_nascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_responsavel: string;
  telefone_whatsapp: string;
  escolaridade: string;
  ano_escolar: string;
  escola: string;
  status: "INSCRITA" | "MATRICULADA" | "CANCELADA" | "EXCEDENTE";
  curso: string;
  created_at: string;
  documento_rg_cpf?: string;
  documento_declaracao?: string;
  documento_termo?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allInscricoes: Inscricao[];
  monitorName: string;
}

interface Filters {
  status: string[];
  curso: string[];
  escolaridade: string[];
  escola: string;
  anoEscolar: string[];
  cidade: string;
  estado: string;
  idadeMin: string;
  idadeMax: string;
}

export function ExportModal({
  isOpen,
  onClose,
  allInscricoes,
  monitorName,
}: ExportModalProps) {
  const [filters, setFilters] = useState<Filters>({
    status: [],
    curso: [],
    escolaridade: [],
    escola: "",
    anoEscolar: [],
    cidade: "",
    estado: "",
    idadeMin: "",
    idadeMax: "",
  });

  const [filteredData, setFilteredData] = useState<Inscricao[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Opções para os filtros baseadas nos dados reais
  const statusOptions = ["INSCRITA", "MATRICULADA", "EXCEDENTE", "CANCELADA"];
  const cursoOptions = ["Jogos", "Robótica"];
  const escolaridadeOptions = [
    "Ensino Fundamental",
    "Ensino Médio",
    "Ensino Superior",
    "Pós-graduação",
  ];
  const anoEscolarOptions = [
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
    "1º ano",
    "2º ano",
    "3º ano",
  ];

  // Função para calcular idade
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) throw new Error("Invalid birth date");

    const today = new Date();
    const birth = new Date(birthDate);

    // Verificar se a data é válida
    if (isNaN(birth.getTime())) throw new Error("Invalid birth date");

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...allInscricoes];

    // Filtro por status
    if (filters.status.length > 0) {
      filtered = filtered.filter((item) =>
        filters.status.includes(item.status)
      );
    }

    // Filtro por curso
    if (filters.curso.length > 0) {
      filtered = filtered.filter((item) => filters.curso.includes(item.curso));
    }

    // Filtro por escolaridade
    if (filters.escolaridade.length > 0) {
      filtered = filtered.filter((item) =>
        filters.escolaridade.includes(item.escolaridade || "")
      );
    }

    // Filtro por escola
    if (filters.escola.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.escola?.toLowerCase().includes(filters.escola.toLowerCase()) ||
          false
      );
    }

    // Filtro por ano escolar
    if (filters.anoEscolar.length > 0) {
      filtered = filtered.filter((item) =>
        filters.anoEscolar.includes(item.ano_escolar || "")
      );
    }

    // Filtro por cidade
    if (filters.cidade.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.cidade?.toLowerCase().includes(filters.cidade.toLowerCase()) ||
          false
      );
    }

    // Filtro por estado
    if (filters.estado.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.estado?.toLowerCase().includes(filters.estado.toLowerCase()) ||
          false
      );
    }

    // Filtro por idade
    if (filters.idadeMin || filters.idadeMax) {
      filtered = filtered.filter((item) => {
        if (!item.data_nascimento) return false; // Skip items without birth date
        try {
          const age = calculateAge(item.data_nascimento);
          const minAge = filters.idadeMin ? parseInt(filters.idadeMin) : 0;
          const maxAge = filters.idadeMax ? parseInt(filters.idadeMax) : 100;
          return age >= minAge && age <= maxAge;
        } catch (error) {
          return false; // Skip items with invalid birth dates
        }
      });
    }

    setFilteredData(filtered);
  }, [filters, allInscricoes]);

  // Funções para manipular filtros
  const toggleArrayFilter = (filterKey: keyof Filters, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[filterKey] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [filterKey]: newArray };
    });
  };

  const setStringFilter = (filterKey: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      curso: [],
      escolaridade: [],
      escola: "",
      anoEscolar: [],
      cidade: "",
      estado: "",
      idadeMin: "",
      idadeMax: "",
    });
  };

  // Contar filtros ativos
  const activeFiltersCount =
    filters.status.length +
    filters.curso.length +
    filters.escolaridade.length +
    filters.anoEscolar.length +
    (filters.escola ? 1 : 0) +
    (filters.cidade ? 1 : 0) +
    (filters.estado ? 1 : 0) +
    (filters.idadeMin ? 1 : 0) +
    (filters.idadeMax ? 1 : 0);

  // Exportar para PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("landscape");

      // Header com gradiente simulado
      doc.setFillColor(111, 46, 181); // Purple
      doc.rect(0, 0, 297, 12, "F");

      doc.setFillColor(255, 74, 151); // Pink
      doc.rect(0, 0, 297, 8, "F");

      // Título principal
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("RELATÓRIO DE MATRÍCULAS", 100, 25);

      // Subtítulo
      doc.setFontSize(16);
      doc.setTextColor(111, 46, 181);
      const now = new Date();
      const year = now.getFullYear();
      const semester = now.getMonth() < 6 ? "1" : "2";
      doc.text(`Mermãs Digitais - Edição ${year}.${semester}`, 100, 35);
      //doc.text("Mermãs Digitais - Programa de Capacitação", 100, 35);

      // Caixa de informações
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 45, 257, 25, "F");
      doc.setDrawColor(111, 46, 181);
      doc.setLineWidth(1);
      doc.rect(20, 45, 257, 25);

      // Informações do relatório
      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      const currentDate = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const currentTime = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      doc.text(`Data de Geracao: ${currentDate}`, 25, 52);
      doc.text(`Horario: ${currentTime}`, 25, 58);
      doc.text(`Gerado por: ${monitorName}`, 150, 52);
      doc.text(`Total de Registros: ${filteredData.length}`, 150, 58);
      doc.text(`Gerado na Plataforma Mermas Digitais`, 25, 64);

      // Linha decorativa
      doc.setDrawColor(255, 74, 151);
      doc.setLineWidth(2);
      doc.line(20, 75, 277, 75);

      // Preparar dados para a tabela
      const tableData = filteredData.map((item, index) => [
        (index + 1).toString(),
        item.nome || "N/A",
        item.email || "N/A",
        item.curso || "N/A",
        item.escolaridade || "N/A",
        item.escola || "N/A",
        item.data_nascimento
          ? (() => {
              try {
                return calculateAge(item.data_nascimento).toString() + " anos";
              } catch {
                return "N/A";
              }
            })()
          : "N/A",
        item.cidade || "N/A",
        item.status || "N/A",
      ]);

      // Criar tabela estilizada
      autoTable(doc, {
        startY: 80,
        head: [
          [
            "N",
            "Nome",
            "E-mail",
            "Curso",
            "Escolaridade",
            "Escola",
            "Idade",
            "Cidade",
            "Status",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [111, 46, 181],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" }, // Nº
          1: { cellWidth: 45, halign: "left" }, // Nome
          2: { cellWidth: 54, halign: "left" }, // Email
          3: { cellWidth: 20, halign: "center" }, // Curso
          4: { cellWidth: 34, halign: "center" }, // Escolaridade
          5: { cellWidth: 35, halign: "left" }, // Escola
          6: { cellWidth: 18, halign: "center" }, // Idade
          7: { cellWidth: 25, halign: "center" }, // Cidade
          8: { cellWidth: 24, halign: "center" }, // Status
        },
        margin: { left: 20, right: 20 },
        didDrawPage: function (data) {
          // Footer em cada página
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // Linha do footer
          doc.setDrawColor(111, 46, 181);
          doc.setLineWidth(1);
          doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);

          // Texto do footer
          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.text(
            `Página ${data.pageNumber} | Relatório confidencial - Mermãs Digitais`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );

          // Data/hora no canto
          doc.text(
            `Gerado em ${currentDate} as ${currentTime}`,
            pageWidth - 25,
            pageHeight - 10,
            { align: "right" }
          );
        },
      });

      // Salvar arquivo com nome único
      const fileName = `relatorio_matriculas_${currentDate.replace(
        /\//g,
        "-"
      )}_${currentTime.replace(/:/g, "-")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar para Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Preparar dados
      const excelData = filteredData.map((item) => ({
        Nome: item.nome || "N/A",
        Email: item.email || "N/A",
        CPF: item.cpf || "N/A",
        Telefone: item.telefone_whatsapp || "N/A",
        "Data de Nascimento": item.data_nascimento
          ? (() => {
              try {
                return new Date(item.data_nascimento).toLocaleDateString(
                  "pt-BR"
                );
              } catch {
                return "N/A";
              }
            })()
          : "N/A",
        Idade: item.data_nascimento
          ? (() => {
              try {
                return calculateAge(item.data_nascimento);
              } catch {
                return "N/A";
              }
            })()
          : "N/A",
        Curso: item.curso || "N/A",
        Escolaridade: item.escolaridade || "N/A",
        Escola: item.escola || "N/A",
        "Ano Escolar": item.ano_escolar || "N/A",
        Endereço: `${item.logradouro || "N/A"}, ${item.numero || "N/A"}${
          item.complemento ? ` - ${item.complemento}` : ""
        } - ${item.bairro || "N/A"}`,
        Cidade: item.cidade || "N/A",
        Estado: item.estado || "N/A",
        CEP: item.cep || "N/A",
        Status: item.status || "N/A",
        "Data de Inscrição": item.created_at
          ? (() => {
              try {
                return new Date(item.created_at).toLocaleDateString("pt-BR");
              } catch {
                return "N/A";
              }
            })()
          : "N/A",
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 35 }, // Email
        { wch: 15 }, // CPF
        { wch: 15 }, // Telefone
        { wch: 15 }, // Data Nascimento
        { wch: 8 }, // Idade
        { wch: 12 }, // Curso
        { wch: 20 }, // Escolaridade
        { wch: 30 }, // Escola
        { wch: 15 }, // Ano Escolar
        { wch: 40 }, // Endereço
        { wch: 20 }, // Cidade
        { wch: 8 }, // Estado
        { wch: 12 }, // CEP
        { wch: 15 }, // Status
        { wch: 15 }, // Data Inscrição
      ];
      ws["!cols"] = colWidths;

      // Adicionar worksheet
      XLSX.utils.book_append_sheet(wb, ws, "Matrículas");

      // Criar sheet de informações
      const infoData = [
        ["Relatório de Matrículas - Mermãs Digitais"],
        [""],
        ["Gerado em:", new Date().toLocaleDateString("pt-BR")],
        ["Horário:", new Date().toLocaleTimeString("pt-BR")],
        ["Por:", monitorName],
        ["Total de registros:", filteredData.length],
        [""],
        ["Gerado na plataforma Mermãs Digitais"],
      ];

      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, infoWs, "Informações");

      // Salvar arquivo
      const currentDate = new Date().toLocaleDateString("pt-BR");
      const currentTime = new Date().toLocaleTimeString("pt-BR");
      const fileName = `matriculas_${currentDate.replace(
        /\//g,
        "-"
      )}_${currentTime.replace(/:/g, "-")}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      alert("Erro ao gerar planilha. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar para Google Sheets
  const exportToGoogleSheets = async () => {
    setIsExporting(true);
    try {
      // Preparar dados para CSV (formato aceito pelo Google Sheets)
      const csvData = filteredData.map((item) => ({
        Nome: item.nome || "",
        Email: item.email || "",
        CPF: item.cpf || "",
        Telefone: item.telefone_whatsapp || "",
        "Data de Nascimento": item.data_nascimento
          ? (() => {
              try {
                return new Date(item.data_nascimento).toLocaleDateString(
                  "pt-BR"
                );
              } catch {
                return "";
              }
            })()
          : "",
        Idade: item.data_nascimento
          ? (() => {
              try {
                return calculateAge(item.data_nascimento).toString();
              } catch {
                return "";
              }
            })()
          : "",
        Curso: item.curso || "",
        Escolaridade: item.escolaridade || "",
        Escola: item.escola || "",
        "Ano Escolar": item.ano_escolar || "",
        Endereço: `${item.logradouro || ""}, ${item.numero || ""}${
          item.complemento ? ` - ${item.complemento}` : ""
        } - ${item.bairro || ""}`,
        Cidade: item.cidade || "",
        Estado: item.estado || "",
        CEP: item.cep || "",
        Status: item.status || "",
        "Data de Inscrição": item.created_at
          ? (() => {
              try {
                return new Date(item.created_at).toLocaleDateString("pt-BR");
              } catch {
                return "";
              }
            })()
          : "",
      }));

      // Preparar dados para URL do Google Sheets
      const headers = Object.keys(csvData[0] || {});
      const currentDate = new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-");
      const currentTime = new Date()
        .toLocaleTimeString("pt-BR")
        .replace(/:/g, "h")
        .replace(/h\d+$/, "h");
      const sheetTitle = `Matrículas Mermãs Digitais - ${currentDate} ${currentTime}`;

      // Preparar dados em formato de matriz para o Google Sheets
      const sheetData = [
        // Cabeçalho informativo
        ["RELATÓRIO DE MATRÍCULAS - MERMÃS DIGITAIS"],
        [""],
        [
          `Gerado em: ${new Date().toLocaleDateString(
            "pt-BR"
          )} às ${new Date().toLocaleTimeString("pt-BR")}`,
        ],
        [`Por: ${monitorName}`],
        [`Total de registros: ${filteredData.length}`],
        ["Gerado na plataforma Mermãs Digitais"],
        [""],
        // Cabeçalhos das colunas
        headers,
        // Dados
        ...csvData.map((row) =>
          headers.map((header) => row[header as keyof typeof row] || "")
        ),
      ];

      // Converter dados para formato CSV
      const csvContent = sheetData
        .map((row) =>
          Array.isArray(row)
            ? row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(",")
            : `"${String(row).replace(/"/g, '""')}"`
        )
        .join("\n");

      // Criar blob do CSV
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Método 1: Tentar usar a API web do Google Sheets (mais moderno)
      try {
        const fileName = `${sheetTitle}.csv`;

        // Criar URL para novo Google Sheets
        const googleSheetsNewUrl =
          "https://docs.google.com/spreadsheets/create";

        // Abrir nova aba
        const newWindow = window.open(
          googleSheetsNewUrl,
          "_blank",
          "width=1200,height=800"
        );

        // Aguardar e então baixar o CSV para importação
        setTimeout(() => {
          // Baixar arquivo CSV para o usuário importar
          const downloadLink = document.createElement("a");
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Mostrar instruções melhoradas
          const instructionsModal = document.createElement("div");
          instructionsModal.innerHTML = `
            <div style="
              position: fixed; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%);
              background: white;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              z-index: 10000;
              max-width: 500px;
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
            ">
              <div style="color: #10b981; font-size: 48px; margin-bottom: 20px;">✅</div>
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Planilha Criada!</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: left;">
                <h3 style="color: #374151; margin-bottom: 15px; font-size: 16px;">📋 Passos simples:</h3>
                <ol style="color: #6b7280; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>O Google Sheets foi aberto em uma nova aba</li>
                  <li>O arquivo <strong>${fileName}</strong> foi baixado</li>
                  <li>No Google Sheets: <strong>Arquivo → Importar</strong></li>
                  <li>Selecione o arquivo baixado</li>
                  <li>Escolha "Substituir planilha" e "Detectar automaticamente"</li>
                  <li>Clique em "Importar dados"</li>
                </ol>
              </div>
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                  💡 <strong>Dica:</strong> Você pode renomear a planilha clicando em "Planilha sem título" no topo
                </p>
              </div>
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                font-weight: 600;
              ">Entendi!</button>
            </div>
            <div style="
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.5);
              z-index: 9999;
            " onclick="this.parentElement.remove()"></div>
          `;

          document.body.appendChild(instructionsModal);

          // Auto-remover após 30 segundos
          setTimeout(() => {
            if (document.body.contains(instructionsModal)) {
              instructionsModal.remove();
            }
          }, 30000);
        }, 1500);
      } catch (fallbackError) {
        console.log("Usando método fallback:", fallbackError);

        // Fallback: Download direto do CSV
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${sheetTitle}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        alert(
          `📄 Arquivo CSV baixado!\n\n` +
            `Para usar no Google Sheets:\n` +
            `1. Acesse: sheets.google.com\n` +
            `2. Criar nova planilha\n` +
            `3. Arquivo → Importar → Fazer upload\n` +
            `4. Selecione o arquivo baixado\n` +
            `5. Configurar como "Substituir planilha" e importar`
        );
      }
    } catch (error) {
      console.error("Erro ao exportar para Google Sheets:", error);
      alert("Erro ao criar planilha do Google. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[90vw] max-w-[90vw] max-h-[90vh] flex flex-col bg-gradient-to-br from-white to-gray-50 p-0 overflow-hidden"
      >
        <DialogHeader className="border-b border-gray-200 px-8 py-6 flex-shrink-0 bg-white">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            Exportar Lista de Matrículas
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Configure os filtros e escolha o formato de exportação desejado. Os
            dados exportados incluirão informações completas das alunas
            selecionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-10">
          <div className="space-y-8 py-8">
            {/* Header de filtros */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900">Filtros de Seleção</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {activeFiltersCount} filtro(s) ativo(s)
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpar Tudo
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Grid responsivo para filtros - 3 colunas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 xl:gap-10">
                  {/* Status */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-green-600" />
                      <Label className="font-semibold text-gray-700">
                        Status
                      </Label>
                    </div>
                    <div className="space-y-2">
                      {statusOptions.map((status) => (
                        <div
                          key={status}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={() =>
                              toggleArrayFilter("status", status)
                            }
                          />
                          <Label
                            htmlFor={`status-${status}`}
                            className="text-sm"
                          >
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Curso */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <Label className="font-semibold text-gray-700">
                        Curso
                      </Label>
                    </div>
                    <div className="space-y-2">
                      {cursoOptions.map((curso) => (
                        <div
                          key={curso}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`curso-${curso}`}
                            checked={filters.curso.includes(curso)}
                            onCheckedChange={() =>
                              toggleArrayFilter("curso", curso)
                            }
                          />
                          <Label htmlFor={`curso-${curso}`} className="text-sm">
                            {curso}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Escolaridade */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <Label className="font-semibold text-gray-700">
                        Escolaridade
                      </Label>
                    </div>
                    <div className="space-y-2">
                      {escolaridadeOptions.map((esc) => (
                        <div key={esc} className="flex items-center space-x-2">
                          <Checkbox
                            id={`esc-${esc}`}
                            checked={filters.escolaridade.includes(esc)}
                            onCheckedChange={() =>
                              toggleArrayFilter("escolaridade", esc)
                            }
                          />
                          <Label htmlFor={`esc-${esc}`} className="text-sm">
                            {esc}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Escola */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <School className="w-4 h-4 text-orange-600" />
                      <Label className="font-semibold text-gray-700">
                        Escola
                      </Label>
                    </div>
                    <EscolaSelector
                      value={filters.escola}
                      onChange={(escola) => setStringFilter("escola", escola)}
                      placeholder="Digite o nome da escola..."
                      className="w-full"
                    />
                  </Card>

                  {/* Localização */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <Label className="font-semibold text-gray-700">
                        Localização
                      </Label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="cidade"
                          className="text-xs text-gray-600"
                        >
                          Cidade
                        </Label>
                        <Input
                          id="cidade"
                          value={filters.cidade}
                          onChange={(e) =>
                            setStringFilter("cidade", e.target.value)
                          }
                          placeholder="Ex: São Paulo"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="estado"
                          className="text-xs text-gray-600"
                        >
                          Estado
                        </Label>
                        <Input
                          id="estado"
                          value={filters.estado}
                          onChange={(e) =>
                            setStringFilter("estado", e.target.value)
                          }
                          placeholder="Ex: SP, RJ, MG"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Idade */}
                  <Card className="p-5 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <Label className="font-semibold text-gray-700">
                        Faixa Etária
                      </Label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label
                          htmlFor="idadeMin"
                          className="text-xs text-gray-600"
                        >
                          Idade mínima
                        </Label>
                        <Input
                          id="idadeMin"
                          type="number"
                          value={filters.idadeMin}
                          onChange={(e) =>
                            setStringFilter("idadeMin", e.target.value)
                          }
                          placeholder="Ex: 14"
                          min="0"
                          max="100"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="idadeMax"
                          className="text-xs text-gray-600"
                        >
                          Idade máxima
                        </Label>
                        <Input
                          id="idadeMax"
                          type="number"
                          value={filters.idadeMax}
                          onChange={(e) =>
                            setStringFilter("idadeMax", e.target.value)
                          }
                          placeholder="Ex: 18"
                          min="0"
                          max="100"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Ano Escolar - Card separado por ser mais longo */}
                <Card className="p-6 bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow mt-8 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <Label className="font-semibold text-gray-700">
                      Ano Escolar
                    </Label>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3 max-h-36 overflow-y-auto overflow-x-hidden pr-2">
                    {anoEscolarOptions.map((ano) => (
                      <div key={ano} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ano-${ano}`}
                          checked={filters.anoEscolar.includes(ano)}
                          onCheckedChange={() =>
                            toggleArrayFilter("anoEscolar", ano)
                          }
                        />
                        <Label htmlFor={`ano-${ano}`} className="text-sm">
                          {ano}
                        </Label>
                      </div>
                    ))}
                  </div>
                </Card>
              </CardContent>
            </Card>

            {/* Preview dos resultados */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-green-900 font-semibold">
                    Preview dos Resultados
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {filteredData.length} registro(s) encontrado(s) com os
                      filtros aplicados
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300 w-fit px-3 py-1 font-semibold"
                    >
                      Total: {filteredData.length}
                    </Badge>
                  </div>

                  {filteredData.length > 0 && (
                    <div className="space-y-3">
                      <Separator className="my-4" />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-700 mb-3 font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            Distribuição por Status:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {statusOptions.map((status) => {
                              const count = filteredData.filter(
                                (item) => item.status === status
                              ).length;
                              if (count > 0) {
                                return (
                                  <Badge
                                    key={status}
                                    variant="outline"
                                    className={`text-xs px-3 py-1 font-medium ${
                                      status === "MATRICULADA"
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : status === "INSCRITA"
                                        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                        : status === "EXCEDENTE"
                                        ? "bg-orange-100 text-orange-700 border-orange-300"
                                        : "bg-red-100 text-red-700 border-red-300"
                                    }`}
                                  >
                                    {status}: {count}
                                  </Badge>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-700 mb-3 font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-600" />
                            Distribuição por Curso:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {cursoOptions.map((curso) => {
                              const count = filteredData.filter(
                                (item) => item.curso === curso
                              ).length;
                              if (count > 0) {
                                return (
                                  <Badge
                                    key={curso}
                                    variant="outline"
                                    className={`text-xs px-3 py-1 font-medium ${
                                      curso === "Jogos"
                                        ? "bg-purple-100 text-purple-700 border-purple-300"
                                        : "bg-blue-100 text-blue-700 border-blue-300"
                                    }`}
                                  >
                                    {curso}: {count}
                                  </Badge>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 bg-white px-1 py-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Botão Cancelar - separado à esquerda */}
            <div className="flex sm:flex-1">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2.5 min-w-[120px] border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Button>
            </div>

            {/* Botões de Exportação - agrupados à direita */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={exportToGoogleSheets}
                disabled={isExporting || filteredData.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 shadow-md hover:shadow-lg transition-all min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isExporting ? "Criando..." : "Google Sheets"}
              </Button>

              <Button
                onClick={exportToExcel}
                disabled={isExporting || filteredData.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 shadow-md hover:shadow-lg transition-all min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {isExporting ? "Exportando..." : "Excel Local"}
              </Button>

              <Button
                onClick={exportToPDF}
                disabled={isExporting || filteredData.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 shadow-md hover:shadow-lg transition-all min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar PDF"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

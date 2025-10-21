import { ExportConfig, EXPORT_FIELDS } from "@/components/export-modal";

/**
 * Utilitários para exportação de dados de eventos
 */

interface InscricaoEvento {
  id: string;
  nomeEquipe?: string;
  equipe_nome?: string;
  status: string;
  modalidade: { nome: string; id: string };
  orientador: {
    nome: string;
    email: string;
    telefone: string;
    escola: string;
  };
  participantesEventos: Array<{
    id: string;
    nome: string;
    cpf: string;
    dataNascimento: string;
    genero: string;
    ouvinte?: boolean;
  }>;
  observacoes?: string;
  createdAt?: string;
}

/**
 * Exporta dados para CSV
 */
export function exportToCSV(
  inscricoes: InscricaoEvento[],
  config: ExportConfig,
  eventoNome: string
) {
  const selectedFieldsData = EXPORT_FIELDS.filter((f) =>
    config.fields.includes(f.id)
  );

  // Processar dados
  let dataToExport = inscricoes.map((inscricao) => {
    const row: Record<string, any> = {};
    selectedFieldsData.forEach((field) => {
      row[field.label] = field.extractor(inscricao);
    });
    return row;
  });

  // Agrupar se necessário
  if (config.groupBy && config.groupBy !== "none") {
    dataToExport = applyGrouping(dataToExport, inscricoes, config.groupBy);
  }

  // Criar CSV
  const headers = Object.keys(dataToExport[0] || {});
  const csvRows = [
    headers.join(","),
    ...dataToExport.map((row) =>
      headers
        .map((header) => {
          const value = row[header]?.toString() || "";
          // Escapar aspas e adicionar aspas ao redor de valores com vírgula
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  // Adicionar resumo se solicitado
  if (config.includeSummary) {
    csvRows.push(""); // Linha vazia
    csvRows.push("RESUMO ESTATÍSTICO");
    csvRows.push(`Total de Inscrições,${inscricoes.length}`);
    csvRows.push(
      `Total de Participantes,${inscricoes.reduce(
        (acc, i) => acc + (i.participantesEventos?.length || 0),
        0
      )}`
    );

    // Distribuição por modalidade
    const modalidadeCount: Record<string, number> = {};
    inscricoes.forEach((i) => {
      const modalidade = i.modalidade?.nome || "Sem modalidade";
      modalidadeCount[modalidade] = (modalidadeCount[modalidade] || 0) + 1;
    });
    csvRows.push("");
    csvRows.push("DISTRIBUIÇÃO POR MODALIDADE");
    Object.entries(modalidadeCount).forEach(([modalidade, count]) => {
      csvRows.push(`${modalidade},${count}`);
    });

    // Distribuição por status
    const statusCount: Record<string, number> = {};
    inscricoes.forEach((i) => {
      const status = i.status || "Sem status";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    csvRows.push("");
    csvRows.push("DISTRIBUIÇÃO POR STATUS");
    Object.entries(statusCount).forEach(([status, count]) => {
      csvRows.push(`${status},${count}`);
    });
  }

  const csv = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${eventoNome}_inscricoes_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  link.click();

  // Exportar planilha de participantes se solicitado
  if (config.includeParticipantDetails) {
    exportParticipantsCSV(inscricoes, eventoNome);
  }
}

/**
 * Exporta dados para Excel (XLSX)
 */
export async function exportToExcel(
  inscricoes: InscricaoEvento[],
  config: ExportConfig,
  eventoNome: string
) {
  // Importação dinâmica do xlsx
  const XLSX = await import("xlsx");

  const selectedFieldsData = EXPORT_FIELDS.filter((f) =>
    config.fields.includes(f.id)
  );

  // Processar dados principais
  const mainData = inscricoes.map((inscricao) => {
    const row: Record<string, any> = {};
    selectedFieldsData.forEach((field) => {
      row[field.label] = field.extractor(inscricao);
    });
    return row;
  });

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba 1: Dados principais
  const ws = XLSX.utils.json_to_sheet(mainData);

  // Ajustar largura das colunas
  const columnWidths = Object.keys(mainData[0] || {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...mainData.map((row) => (row[key]?.toString() || "").length)
    ),
  }));
  ws["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Inscrições");

  // Aba 2: Resumo (se solicitado)
  if (config.includeSummary) {
    const summaryData = generateSummaryData(inscricoes);
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
  }

  // Aba 3: Participantes (se solicitado)
  if (config.includeParticipantDetails) {
    const participantsData = generateParticipantsData(inscricoes);
    const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
    XLSX.utils.book_append_sheet(wb, wsParticipants, "Participantes");
  }

  // Aba 4: Distribuições por modalidade
  const modalidadeData = generateModalidadeDistribution(inscricoes);
  const wsModalidade = XLSX.utils.json_to_sheet(modalidadeData);
  XLSX.utils.book_append_sheet(wb, wsModalidade, "Por Modalidade");

  // Salvar arquivo
  XLSX.writeFile(
    wb,
    `${eventoNome}_completo_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

/**
 * Exporta dados para PDF
 */
export async function exportToPDF(
  inscricoes: InscricaoEvento[],
  config: ExportConfig,
  eventoNome: string
) {
  // Importação dinâmica do jsPDF
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const selectedFieldsData = EXPORT_FIELDS.filter((f) =>
    config.fields.includes(f.id)
  );

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Relatório de Inscrições - ${eventoNome}`, 14, 15);

  // Data de geração
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString(
      "pt-BR"
    )} às ${new Date().toLocaleTimeString("pt-BR")}`,
    14,
    22
  );

  // Preparar dados para tabela
  const headers = selectedFieldsData.map((f) => f.label);
  const rows = inscricoes.map((inscricao) =>
    selectedFieldsData.map(
      (field) => field.extractor(inscricao)?.toString() || ""
    )
  );

  // Tabela principal
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 28,
    theme: "grid",
    headStyles: {
      fillColor: [124, 58, 237], // Purple
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
    },
  });

  // Adicionar resumo se solicitado
  if (config.includeSummary) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Estatístico", 14, finalY);

    const summaryData = [
      ["Total de Inscrições", inscricoes.length.toString()],
      [
        "Total de Participantes",
        inscricoes
          .reduce((acc, i) => acc + (i.participantesEventos?.length || 0), 0)
          .toString(),
      ],
      [
        "Média de Participantes por Equipe",
        (
          inscricoes.reduce(
            (acc, i) => acc + (i.participantesEventos?.length || 0),
            0
          ) / inscricoes.length
        ).toFixed(2),
      ],
    ];

    (doc as any).autoTable({
      body: summaryData,
      startY: finalY + 5,
      theme: "plain",
      styles: {
        fontSize: 10,
      },
    });
  }

  // Salvar PDF
  doc.save(
    `${eventoNome}_relatorio_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

/**
 * Aplica agrupamento aos dados
 */
function applyGrouping(
  data: any[],
  inscricoes: InscricaoEvento[],
  groupBy: "modalidade" | "status" | "escola"
) {
  // Adicionar coluna de agrupamento no início
  return data.map((row, index) => {
    const inscricao = inscricoes[index];
    let groupValue = "";

    switch (groupBy) {
      case "modalidade":
        groupValue = inscricao.modalidade?.nome || "Sem modalidade";
        break;
      case "status":
        groupValue = inscricao.status || "Sem status";
        break;
      case "escola":
        groupValue = inscricao.orientador?.escola || "Sem escola";
        break;
    }

    return {
      Grupo: groupValue,
      ...row,
    };
  });
}

/**
 * Exporta planilha de participantes separada (CSV)
 */
function exportParticipantsCSV(
  inscricoes: InscricaoEvento[],
  eventoNome: string
) {
  const participantsData: any[] = [];

  inscricoes.forEach((inscricao) => {
    inscricao.participantesEventos?.forEach((participante) => {
      participantsData.push({
        "Nome da Equipe": inscricao.nomeEquipe || inscricao.equipe_nome || "",
        Modalidade: inscricao.modalidade?.nome || "",
        "Nome do Participante": participante.nome,
        CPF: participante.cpf,
        "Data de Nascimento": participante.dataNascimento
          ? new Date(participante.dataNascimento).toLocaleDateString("pt-BR")
          : "N/A",
        Gênero: participante.genero,
        Idade: participante.dataNascimento
          ? new Date().getFullYear() -
            new Date(participante.dataNascimento).getFullYear()
          : "N/A",
        Tipo: participante.ouvinte ? "Ouvinte" : "Competidor",
        "Orientador - Nome": inscricao.orientador?.nome || "",
        "Orientador - Email": inscricao.orientador?.email || "",
        "Orientador - Telefone": inscricao.orientador?.telefone || "",
        Escola: inscricao.orientador?.escola || "",
      });
    });
  });

  const headers = Object.keys(participantsData[0] || {});
  const csvRows = [
    headers.join(","),
    ...participantsData.map((row) =>
      headers
        .map((header) => {
          const value = row[header]?.toString() || "";
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const csv = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${eventoNome}_participantes_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  link.click();
}

/**
 * Gera dados de resumo para Excel
 */
function generateSummaryData(inscricoes: InscricaoEvento[]) {
  const totalParticipantes = inscricoes.reduce(
    (acc, i) => acc + (i.participantesEventos?.length || 0),
    0
  );

  const modalidadeCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};
  const escolaCount: Record<string, number> = {};

  inscricoes.forEach((i) => {
    const modalidade = i.modalidade?.nome || "Sem modalidade";
    modalidadeCount[modalidade] = (modalidadeCount[modalidade] || 0) + 1;

    const status = i.status || "Sem status";
    statusCount[status] = (statusCount[status] || 0) + 1;

    const escola = i.orientador?.escola || "Sem escola";
    escolaCount[escola] = (escolaCount[escola] || 0) + 1;
  });

  return [
    { Métrica: "Total de Inscrições", Valor: inscricoes.length },
    { Métrica: "Total de Participantes", Valor: totalParticipantes },
    {
      Métrica: "Média de Participantes por Equipe",
      Valor: (totalParticipantes / inscricoes.length).toFixed(2),
    },
    {
      Métrica: "Total de Escolas Únicas",
      Valor: Object.keys(escolaCount).length,
    },
    { Métrica: "", Valor: "" },
    { Métrica: "DISTRIBUIÇÃO POR MODALIDADE", Valor: "" },
    ...Object.entries(modalidadeCount).map(([modalidade, count]) => ({
      Métrica: modalidade,
      Valor: count,
    })),
    { Métrica: "", Valor: "" },
    { Métrica: "DISTRIBUIÇÃO POR STATUS", Valor: "" },
    ...Object.entries(statusCount).map(([status, count]) => ({
      Métrica: status,
      Valor: count,
    })),
    { Métrica: "", Valor: "" },
    { Métrica: "TOP 10 ESCOLAS", Valor: "" },
    ...Object.entries(escolaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([escola, count]) => ({
        Métrica: escola,
        Valor: count,
      })),
  ];
}

/**
 * Gera dados de participantes para Excel
 */
function generateParticipantsData(inscricoes: InscricaoEvento[]) {
  const participantsData: any[] = [];

  inscricoes.forEach((inscricao) => {
    inscricao.participantesEventos?.forEach((participante) => {
      participantsData.push({
        "Nome da Equipe": inscricao.nomeEquipe || inscricao.equipe_nome || "",
        Modalidade: inscricao.modalidade?.nome || "",
        Status: inscricao.status || "",
        "Nome do Participante": participante.nome,
        CPF: participante.cpf,
        "Data de Nascimento": participante.dataNascimento
          ? new Date(participante.dataNascimento).toLocaleDateString("pt-BR")
          : "N/A",
        Gênero: participante.genero,
        Idade: participante.dataNascimento
          ? new Date().getFullYear() -
            new Date(participante.dataNascimento).getFullYear()
          : "N/A",
        Tipo: participante.ouvinte ? "Ouvinte" : "Competidor",
        "Orientador - Nome": inscricao.orientador?.nome || "",
        "Orientador - Email": inscricao.orientador?.email || "",
        "Orientador - Telefone": inscricao.orientador?.telefone || "",
        Escola: inscricao.orientador?.escola || "",
      });
    });
  });

  return participantsData;
}

/**
 * Gera distribuição por modalidade para Excel
 */
function generateModalidadeDistribution(inscricoes: InscricaoEvento[]) {
  const modalidades: Record<
    string,
    {
      inscricoes: number;
      participantes: number;
      escolas: Set<string>;
      ouvintes: number;
      competidores: number;
    }
  > = {};

  inscricoes.forEach((inscricao) => {
    const modalidade = inscricao.modalidade?.nome || "Sem modalidade";

    if (!modalidades[modalidade]) {
      modalidades[modalidade] = {
        inscricoes: 0,
        participantes: 0,
        escolas: new Set(),
        ouvintes: 0,
        competidores: 0,
      };
    }

    modalidades[modalidade].inscricoes += 1;
    modalidades[modalidade].participantes +=
      inscricao.participantesEventos?.length || 0;

    if (inscricao.orientador?.escola) {
      modalidades[modalidade].escolas.add(inscricao.orientador.escola);
    }

    inscricao.participantesEventos?.forEach((p) => {
      if (p.ouvinte) {
        modalidades[modalidade].ouvintes += 1;
      } else {
        modalidades[modalidade].competidores += 1;
      }
    });
  });

  return Object.entries(modalidades).map(([modalidade, stats]) => ({
    Modalidade: modalidade,
    "Total de Inscrições": stats.inscricoes,
    "Total de Participantes": stats.participantes,
    "Média de Participantes por Equipe": (
      stats.participantes / stats.inscricoes
    ).toFixed(2),
    "Escolas Únicas": stats.escolas.size,
    Ouvintes: stats.ouvintes,
    Competidores: stats.competidores,
  }));
}

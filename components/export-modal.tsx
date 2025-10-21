"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  X,
  Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface ExportField {
  id: string;
  label: string;
  category: "equipe" | "orientador" | "participantes" | "metadata" | "status";
  defaultEnabled: boolean;
  extractor: (inscricao: any) => string | number;
}

export interface ExportConfig {
  fields: string[];
  format: "csv" | "excel" | "pdf";
  includeFiltered: boolean;
  groupBy?: "modalidade" | "status" | "escola" | "none";
  includeSummary: boolean;
  includeParticipantDetails: boolean;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: {
    id: string;
    nome: string;
  };
  inscricoes: any[];
  filteredInscricoes: any[];
  onExport: (config: ExportConfig) => void;
}

export const EXPORT_FIELDS: ExportField[] = [
  // Equipe
  {
    id: "nomeEquipe",
    label: "Nome da Equipe",
    category: "equipe",
    defaultEnabled: true,
    extractor: (i) => i.nomeEquipe || i.equipe_nome || "",
  },
  {
    id: "modalidade",
    label: "Modalidade",
    category: "equipe",
    defaultEnabled: true,
    extractor: (i) => i.modalidade?.nome || "",
  },

  // Orientador
  {
    id: "orientadorNome",
    label: "Nome do Orientador",
    category: "orientador",
    defaultEnabled: true,
    extractor: (i) => i.orientador?.nome || "",
  },
  {
    id: "orientadorEmail",
    label: "Email do Orientador",
    category: "orientador",
    defaultEnabled: true,
    extractor: (i) => i.orientador?.email || "",
  },
  {
    id: "orientadorTelefone",
    label: "Telefone do Orientador",
    category: "orientador",
    defaultEnabled: true,
    extractor: (i) => i.orientador?.telefone || "",
  },
  {
    id: "orientadorEscola",
    label: "Escola do Orientador",
    category: "orientador",
    defaultEnabled: true,
    extractor: (i) => i.orientador?.escola || "",
  },

  // Participantes
  {
    id: "totalParticipantes",
    label: "Total de Participantes",
    category: "participantes",
    defaultEnabled: true,
    extractor: (i) => i.participantesEventos?.length || 0,
  },
  {
    id: "participantesNomes",
    label: "Nomes dos Participantes",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos?.map((p: any) => p.nome).join("; ") || "",
  },
  {
    id: "participantesCPFs",
    label: "CPFs dos Participantes",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos?.map((p: any) => p.cpf).join("; ") || "",
  },
  {
    id: "participantesGeneros",
    label: "Gêneros dos Participantes",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos?.map((p: any) => p.genero).join("; ") || "",
  },
  {
    id: "participantesIdades",
    label: "Idades dos Participantes",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos
        ?.map((p: any) => {
          if (!p.dataNascimento) return "N/A";
          const idade =
            new Date().getFullYear() - new Date(p.dataNascimento).getFullYear();
          return idade;
        })
        .join("; ") || "",
  },
  {
    id: "participantesOuvintes",
    label: "Total de Ouvintes",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos?.filter((p: any) => p.ouvinte).length || 0,
  },
  {
    id: "participantesCompetidores",
    label: "Total de Competidores",
    category: "participantes",
    defaultEnabled: false,
    extractor: (i) =>
      i.participantesEventos?.filter((p: any) => !p.ouvinte).length || 0,
  },

  // Status
  {
    id: "status",
    label: "Status da Inscrição",
    category: "status",
    defaultEnabled: true,
    extractor: (i) => i.status || "",
  },
  {
    id: "observacoes",
    label: "Observações",
    category: "status",
    defaultEnabled: false,
    extractor: (i) => i.observacoes || "",
  },

  // Metadata
  {
    id: "dataInscricao",
    label: "Data de Inscrição",
    category: "metadata",
    defaultEnabled: false,
    extractor: (i) =>
      i.createdAt ? new Date(i.createdAt).toLocaleDateString("pt-BR") : "N/A",
  },
  {
    id: "idInscricao",
    label: "ID da Inscrição",
    category: "metadata",
    defaultEnabled: false,
    extractor: (i) => i.id || "",
  },
];

export function ExportModal({
  open,
  onOpenChange,
  evento,
  inscricoes,
  filteredInscricoes,
  onExport,
}: ExportModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter((f) => f.defaultEnabled).map((f) => f.id)
  );
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");
  const [includeFiltered, setIncludeFiltered] = useState(true);
  const [groupBy, setGroupBy] = useState<
    "modalidade" | "status" | "escola" | "none"
  >("none");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeParticipantDetails, setIncludeParticipantDetails] =
    useState(false);

  const handleToggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleToggleCategory = (category: string) => {
    const categoryFields = EXPORT_FIELDS.filter((f) => f.category === category);
    const allSelected = categoryFields.every((f) =>
      selectedFields.includes(f.id)
    );

    if (allSelected) {
      setSelectedFields((prev) =>
        prev.filter((id) => !categoryFields.map((f) => f.id).includes(id))
      );
    } else {
      setSelectedFields((prev) => [
        ...prev,
        ...categoryFields.map((f) => f.id).filter((id) => !prev.includes(id)),
      ]);
    }
  };

  const handleSelectAll = () => {
    setSelectedFields(EXPORT_FIELDS.map((f) => f.id));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um campo para exportar.",
        variant: "destructive",
      });
      return;
    }

    const config: ExportConfig = {
      fields: selectedFields,
      format,
      includeFiltered,
      groupBy,
      includeSummary,
      includeParticipantDetails,
    };

    onExport(config);
    onOpenChange(false);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    equipe: "👥",
    orientador: "🎓",
    participantes: "👤",
    status: "📊",
    metadata: "📅",
  };

  const categoryLabels: Record<string, string> = {
    equipe: "Dados da Equipe",
    orientador: "Dados do Orientador",
    participantes: "Dados dos Participantes",
    status: "Status e Observações",
    metadata: "Metadados",
  };

  const dataToExport = includeFiltered ? filteredInscricoes : inscricoes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileDown className="h-6 w-6 text-purple-600" />
            Exportar Dados do Evento
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure os dados que deseja exportar de{" "}
            <span className="font-semibold text-purple-600">{evento.nome}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="format">Formato</TabsTrigger>
            <TabsTrigger value="options">Opções</TabsTrigger>
          </TabsList>

          {/* Tab: Campos */}
          <TabsContent value="fields" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedFields.length} de {EXPORT_FIELDS.length} campos
                selecionados • {dataToExport.length} registro(s)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(categoryLabels).map(([category, label]) => {
                const categoryFields = EXPORT_FIELDS.filter(
                  (f) => f.category === category
                );
                const selectedCount = categoryFields.filter((f) =>
                  selectedFields.includes(f.id)
                ).length;

                return (
                  <div
                    key={category}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => handleToggleCategory(category)}
                        className="flex items-center gap-2 font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                      >
                        <span className="text-xl">
                          {categoryIcons[category]}
                        </span>
                        <span>{label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {selectedCount}/{categoryFields.length}
                        </Badge>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryFields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => handleToggleField(field.id)}
                          />
                          <Label
                            htmlFor={field.id}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Formato */}
          <TabsContent value="format" className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">
                Selecione o formato de exportação
              </h3>
              <RadioGroup value={format} onValueChange={setFormat as any}>
                <div className="space-y-3">
                  <div
                    className={`flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      format === "csv"
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => setFormat("csv")}
                  >
                    <RadioGroupItem value="csv" id="csv" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <Label
                          htmlFor="csv"
                          className="font-semibold cursor-pointer"
                        >
                          CSV (Comma Separated Values)
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Formato universal compatível com Excel, Google Sheets e
                        outros
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Leve
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Universal
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      format === "excel"
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => setFormat("excel")}
                  >
                    <RadioGroupItem value="excel" id="excel" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        <Label
                          htmlFor="excel"
                          className="font-semibold cursor-pointer"
                        >
                          Excel (XLSX)
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Formato Microsoft Excel com formatação avançada e
                        múltiplas planilhas
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Formatado
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Múltiplas Abas
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Gráficos
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      format === "pdf"
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => setFormat("pdf")}
                  >
                    <RadioGroupItem value="pdf" id="pdf" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        <Label
                          htmlFor="pdf"
                          className="font-semibold cursor-pointer"
                        >
                          PDF (Portable Document Format)
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Documento formatado para impressão e compartilhamento
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Imutável
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Profissional
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Impressão
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          {/* Tab: Opções */}
          <TabsContent value="options" className="space-y-6">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="includeFiltered"
                    checked={includeFiltered}
                    onCheckedChange={(checked) =>
                      setIncludeFiltered(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="includeFiltered"
                      className="font-semibold cursor-pointer"
                    >
                      Exportar apenas registros filtrados
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {includeFiltered
                        ? `Exportará ${filteredInscricoes.length} registro(s) filtrado(s)`
                        : `Exportará todos os ${inscricoes.length} registro(s)`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <Label className="font-semibold mb-3 block">
                  Agrupar dados por:
                </Label>
                <RadioGroup value={groupBy} onValueChange={setGroupBy as any}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="groupNone" />
                      <Label htmlFor="groupNone" className="cursor-pointer">
                        Sem agrupamento
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="modalidade" id="groupModalidade" />
                      <Label
                        htmlFor="groupModalidade"
                        className="cursor-pointer"
                      >
                        Modalidade
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="status" id="groupStatus" />
                      <Label htmlFor="groupStatus" className="cursor-pointer">
                        Status da Inscrição
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="escola" id="groupEscola" />
                      <Label htmlFor="groupEscola" className="cursor-pointer">
                        Escola
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="includeSummary"
                    checked={includeSummary}
                    onCheckedChange={(checked) =>
                      setIncludeSummary(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="includeSummary"
                      className="font-semibold cursor-pointer"
                    >
                      Incluir resumo estatístico
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Adiciona uma seção com totais, médias e distribuições
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="includeParticipantDetails"
                    checked={includeParticipantDetails}
                    onCheckedChange={(checked) =>
                      setIncludeParticipantDetails(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="includeParticipantDetails"
                      className="font-semibold cursor-pointer"
                    >
                      Criar planilha separada para participantes
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Gera uma aba/arquivo adicional com detalhes individuais de
                      cada participante
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{dataToExport.length}</span>{" "}
            registro(s) •{" "}
            <span className="font-semibold">{selectedFields.length}</span>{" "}
            campo(s)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar {format.toUpperCase()}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

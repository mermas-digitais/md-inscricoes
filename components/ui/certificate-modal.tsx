import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  Calendar,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Inscricao {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  curso: string;
  status: string;
  data_conclusao?: string;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAlunas: Inscricao[];
}

interface CertificateResult {
  success: boolean;
  alunaId: string;
  alunaNome: string;
  email: string;
  error?: string;
  messageId?: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  selectedAlunas,
}: CertificateModalProps) {
  const [dataConclusao, setDataConclusao] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<CertificateResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Definir data padrão como hoje
  useEffect(() => {
    if (isOpen && !dataConclusao) {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      setDataConclusao(formattedDate);
    }
  }, [isOpen, dataConclusao]);

  // Resetar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setDataConclusao("");
      setResults([]);
      setShowResults(false);
      setIsSending(false);
    }
  }, [isOpen]);

  const handleSendCertificates = async () => {
    if (selectedAlunas.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma aluna selecionada",
        variant: "destructive",
      });
      return;
    }

    if (!dataConclusao) {
      toast({
        title: "Erro",
        description: "Data de conclusão é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setShowResults(false);

    try {
      const response = await fetch("/api/matriculas/send-certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alunaIds: selectedAlunas.map((aluna) => aluna.id),
          dataConclusao: dataConclusao,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setResults(result.results || []);
        setShowResults(true);

        const successCount = result.statistics?.success || 0;
        const errorCount = result.statistics?.errors || 0;

        toast({
          title: "Certificados Enviados",
          description: `${successCount} certificados enviados com sucesso${
            errorCount > 0 ? `, ${errorCount} com erro` : ""
          }`,
        });
      } else {
        throw new Error(result.error || "Erro ao enviar certificados");
      }
    } catch (error) {
      console.error("Erro ao enviar certificados:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar certificados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Enviar Certificados
          </DialogTitle>
          <DialogDescription>
            Envie certificados personalizados para as alunas selecionadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo das alunas selecionadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Alunas Selecionadas ({selectedAlunas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {selectedAlunas.map((aluna) => (
                  <div
                    key={aluna.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{aluna.nome}</div>
                      <div className="text-xs text-gray-500">{aluna.email}</div>
                      <div className="text-xs text-gray-500">{aluna.curso}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {aluna.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuração da data de conclusão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Configuração do Certificado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataConclusao">Data de Conclusão</Label>
                  <Input
                    id="dataConclusao"
                    type="date"
                    value={dataConclusao}
                    onChange={(e) => setDataConclusao(e.target.value)}
                    disabled={isSending}
                  />
                  <p className="text-xs text-gray-500">
                    Data que aparecerá no certificado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Informações do Certificado</Label>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Nome da aluna
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      CPF formatado
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de conclusão
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Carga horária do curso
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultados do envio */}
          {showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5" />
                  Resultados do Envio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">{successCount}</span>
                    </div>
                    <div className="text-sm text-green-600">Enviados</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">{errorCount}</span>
                    </div>
                    <div className="text-sm text-red-600">Com Erro</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium text-sm">
                            {result.alunaNome}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {result.email}
                        </div>
                        {result.error && (
                          <div className="text-xs text-red-600 ml-6 mt-1">
                            {result.error}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={result.success ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.success ? "Enviado" : "Erro"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {showResults ? "Fechar" : "Cancelar"}
          </Button>

          {!showResults && (
            <Button
              onClick={handleSendCertificates}
              disabled={isSending || selectedAlunas.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  Enviar Certificados
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

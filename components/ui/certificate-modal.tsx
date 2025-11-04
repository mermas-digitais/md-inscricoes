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

interface PessoaManual {
  id: string; // ID temporário gerado
  nome: string;
  cpf: string;
  email: string;
  curso: string;
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
  const [emailAlternativos, setEmailAlternativos] = useState<
    Record<string, string>
  >({});
  const [pessoasManuais, setPessoasManuais] = useState<PessoaManual[]>([]);
  const [novaPessoa, setNovaPessoa] = useState<Omit<PessoaManual, "id">>({
    nome: "",
    cpf: "",
    email: "",
    curso: "",
  });

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
      setEmailAlternativos({});
      setPessoasManuais([]);
      setNovaPessoa({ nome: "", cpf: "", email: "", curso: "" });
    }
  }, [isOpen]);

  const handleAddPessoaManual = () => {
    if (
      !novaPessoa.nome ||
      !novaPessoa.cpf ||
      !novaPessoa.email ||
      !novaPessoa.curso
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar CPF básico (11 dígitos)
    const cpfLimpo = novaPessoa.cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      toast({
        title: "Erro",
        description: "CPF deve conter 11 dígitos",
        variant: "destructive",
      });
      return;
    }

    // Validar email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(novaPessoa.email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive",
      });
      return;
    }

    const pessoa: PessoaManual = {
      id: `manual-${Date.now()}-${Math.random()}`,
      ...novaPessoa,
    };

    setPessoasManuais([...pessoasManuais, pessoa]);
    setNovaPessoa({ nome: "", cpf: "", email: "", curso: "" });

    toast({
      title: "Pessoa adicionada",
      description: `${pessoa.nome} foi adicionada à lista`,
    });
  };

  const handleRemovePessoaManual = (id: string) => {
    setPessoasManuais(pessoasManuais.filter((p) => p.id !== id));
  };

  const handleSendCertificates = async () => {
    const totalPessoas = selectedAlunas.length + pessoasManuais.length;

    if (totalPessoas === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma pessoa selecionada ou adicionada",
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
          alunaIds:
            selectedAlunas.length > 0
              ? selectedAlunas.map((aluna) => aluna.id)
              : undefined,
          dataConclusao: dataConclusao,
          emailAlternativos:
            Object.keys(emailAlternativos).length > 0
              ? emailAlternativos
              : undefined,
          pessoasManuais:
            pessoasManuais.length > 0 ? pessoasManuais : undefined,
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedAlunas.map((aluna) => (
                  <div
                    key={aluna.id}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{aluna.nome}</div>
                        <div className="text-xs text-gray-500">
                          Email: {aluna.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {aluna.curso}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {aluna.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`email-${aluna.id}`} className="text-xs">
                        Email alternativo (opcional)
                      </Label>
                      <Input
                        id={`email-${aluna.id}`}
                        type="email"
                        placeholder="Deixe em branco para usar o email cadastrado"
                        value={emailAlternativos[aluna.id] || ""}
                        onChange={(e) => {
                          const newEmails = { ...emailAlternativos };
                          if (e.target.value.trim()) {
                            newEmails[aluna.id] = e.target.value.trim();
                          } else {
                            delete newEmails[aluna.id];
                          }
                          setEmailAlternativos(newEmails);
                        }}
                        disabled={isSending}
                        className="text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Adicionar pessoas manualmente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Adicionar Pessoa Manualmente ({pessoasManuais.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para adicionar nova pessoa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-1">
                  <Label htmlFor="nome-manual" className="text-xs">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome-manual"
                    type="text"
                    placeholder="Nome completo"
                    value={novaPessoa.nome}
                    onChange={(e) =>
                      setNovaPessoa({ ...novaPessoa, nome: e.target.value })
                    }
                    disabled={isSending}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpf-manual" className="text-xs">
                    CPF *
                  </Label>
                  <Input
                    id="cpf-manual"
                    type="text"
                    placeholder="000.000.000-00"
                    value={novaPessoa.cpf}
                    onChange={(e) =>
                      setNovaPessoa({ ...novaPessoa, cpf: e.target.value })
                    }
                    disabled={isSending}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email-manual" className="text-xs">
                    Email *
                  </Label>
                  <Input
                    id="email-manual"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={novaPessoa.email}
                    onChange={(e) =>
                      setNovaPessoa({ ...novaPessoa, email: e.target.value })
                    }
                    disabled={isSending}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="curso-manual" className="text-xs">
                    Curso *
                  </Label>
                  <Input
                    id="curso-manual"
                    type="text"
                    placeholder="Nome do curso"
                    value={novaPessoa.curso}
                    onChange={(e) =>
                      setNovaPessoa({ ...novaPessoa, curso: e.target.value })
                    }
                    disabled={isSending}
                    className="text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddPessoaManual}
                    disabled={isSending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                    size="sm"
                  >
                    <Users className="w-3 h-3 mr-2" />
                    Adicionar Pessoa
                  </Button>
                </div>
              </div>

              {/* Lista de pessoas adicionadas manualmente */}
              {pessoasManuais.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pessoasManuais.map((pessoa) => (
                    <div
                      key={pessoa.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{pessoa.nome}</div>
                        <div className="text-xs text-gray-500">
                          CPF: {pessoa.cpf} | Email: {pessoa.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          Curso: {pessoa.curso}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePessoaManual(pessoa.id)}
                        disabled={isSending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              disabled={
                isSending ||
                (selectedAlunas.length === 0 && pessoasManuais.length === 0)
              }
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

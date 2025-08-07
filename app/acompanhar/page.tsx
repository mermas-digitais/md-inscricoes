"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";

interface InscricaoData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cpf: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  curso_interesse: string;
  experiencia_nivel: string;
  motivacao: string;
  disponibilidade: string;
  como_soube: string;
  created_at: string;
}

const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR");
};

const getStatusBadge = () => {
  return (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle2 className="w-4 h-4 mr-1" />
      Confirmada
    </Badge>
  );
};

const cursoDisplayNames: { [key: string]: string } = {
  Jogos: "Desenvolvimento de Jogos",
  Robótica: "Robótica e Automação",
  "programacao-web": "Programação Web",
  "design-grafico": "Design Gráfico",
  "marketing-digital": "Marketing Digital",
  "analise-dados": "Análise de Dados",
  "mobile-development": "Desenvolvimento Mobile",
  "ux-ui": "UX/UI Design",
};

export default function AcompanharPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cpfFromUrl = searchParams.get("cpf");

  const [cpf, setCpf] = useState(cpfFromUrl || "");
  const [inscricao, setInscricao] = useState<InscricaoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Auto-search se CPF veio da URL
  useEffect(() => {
    if (cpfFromUrl && cpfFromUrl.length >= 11) {
      handleSearch(cpfFromUrl);
    }
  }, [cpfFromUrl]);

  const handleSearch = async (cpfToSearch?: string) => {
    const cpfValue = cpfToSearch || cpf;

    if (!cpfValue || cpfValue.length < 11) {
      setError("Por favor, digite um CPF válido");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      // Codificar o CPF para URL (os pontos e traços precisam ser codificados)
      const encodedCpf = encodeURIComponent(cpfValue);

      const response = await fetch(
        `/api/inscricao/consultar?cpf=${encodedCpf}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao consultar inscrição");
      }

      setInscricao(data.inscricao);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao consultar inscrição"
      );
      setInscricao(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})/, "$1-$2");
    setCpf(value);
  };

  const handleNewSearch = () => {
    if (cpf && cpf.length >= 11) {
      // Navegar para a URL com query parameter
      router.push(`/acompanhar?cpf=${encodeURIComponent(cpf)}`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: "Acompanhar Inscrição - Mermãs Digitais",
        text: "Acompanhe sua inscrição nos cursos da Mermãs Digitais",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF4A97' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Fixed background image */}
      <div className="fixed inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <img
          src="/placeholder-logo.svg"
          alt="Background"
          className="w-96 h-96 object-contain"
        />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Acompanhar Inscrição
                </h1>
                <p className="text-gray-600 mt-2">
                  Consulte o status da sua inscrição nos cursos Mermãs Digitais
                </p>
              </div>

              {inscricao && (
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              )}
            </div>
          </div>

          {/* Search Section */}
          <Card className="mb-8 border-2 border-purple-100 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Inscrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label
                    htmlFor="cpf"
                    className="text-sm font-medium text-gray-700"
                  >
                    CPF do candidato
                  </Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleNewSearch}
                    disabled={loading || cpf.length < 14}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {searched && !loading && !inscricao && !error && (
            <Card className="mb-8 border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhuma inscrição encontrada
                </h3>
                <p className="text-gray-500">
                  Não encontramos nenhuma inscrição com o CPF informado.
                  Verifique se digitou corretamente ou faça sua inscrição.
                </p>
                <Link href="/inscricao">
                  <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Fazer Inscrição
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {inscricao && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="border-2 border-green-200 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-green-700">
                      Status da Inscrição
                    </CardTitle>
                    {getStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Curso selecionado</p>
                      <p className="font-semibold text-lg text-purple-700">
                        {cursoDisplayNames[inscricao.curso_interesse] ||
                          inscricao.curso_interesse}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data da inscrição</p>
                      <p className="font-semibold">
                        {formatDate(inscricao.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Info */}
              <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Nome completo
                      </p>
                      <p className="font-semibold">{inscricao.nome_completo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CPF</p>
                      <p className="font-semibold">
                        {formatCPF(inscricao.cpf)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Data de nascimento
                      </p>
                      <p className="font-semibold">
                        {formatDate(inscricao.data_nascimento)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Telefone</p>
                      <p className="font-semibold">
                        {formatPhone(inscricao.telefone)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      {inscricao.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Info */}
              <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Endereço</p>
                      <p className="font-semibold">{inscricao.endereco}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CEP</p>
                      <p className="font-semibold">{inscricao.cep}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cidade</p>
                      <p className="font-semibold">{inscricao.cidade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estado</p>
                      <p className="font-semibold">{inscricao.estado}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Course Info */}
              <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-700 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Informações do Curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Nível de experiência
                      </p>
                      <p className="font-semibold capitalize">
                        {inscricao.experiencia_nivel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Disponibilidade
                      </p>
                      <p className="font-semibold">
                        {inscricao.disponibilidade}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Como soube do curso
                      </p>
                      <p className="font-semibold">{inscricao.como_soube}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Motivação</p>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {inscricao.motivacao}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-700">
                    Próximos Passos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">
                          Confirmação recebida
                        </p>
                        <p className="text-sm text-gray-600">
                          Sua inscrição foi registrada com sucesso
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">
                          Análise da inscrição
                        </p>
                        <p className="text-sm text-gray-600">
                          Nossa equipe irá analisar sua candidatura
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">
                          Comunicação do resultado
                        </p>
                        <p className="text-sm text-gray-600">
                          Enviaremos o resultado por email em até 7 dias úteis
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p className="text-sm">
              © 2025 Mermãs Digitais. Construindo o futuro digital feminino.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

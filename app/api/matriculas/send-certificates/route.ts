import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/lib/services/certificate-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const certificateService = new CertificateService();

  try {
    const body = await request.json();
    const { alunaIds, dataConclusao, emailAlternativos, pessoasManuais } = body;

    // Validar que pelo menos um tipo de pessoa foi fornecido
    const temAlunas =
      alunaIds && Array.isArray(alunaIds) && alunaIds.length > 0;
    const temPessoasManuais =
      pessoasManuais &&
      Array.isArray(pessoasManuais) &&
      pessoasManuais.length > 0;

    if (!temAlunas && !temPessoasManuais) {
      return NextResponse.json(
        { error: "É necessário fornecer IDs das alunas ou pessoas manuais" },
        { status: 400 }
      );
    }

    // Validar alunaIds se fornecido
    if (alunaIds && (!Array.isArray(alunaIds) || alunaIds.length === 0)) {
      return NextResponse.json(
        { error: "IDs das alunas devem ser um array não vazio" },
        { status: 400 }
      );
    }

    // Validar pessoasManuais se fornecido
    if (pessoasManuais) {
      if (!Array.isArray(pessoasManuais) || pessoasManuais.length === 0) {
        return NextResponse.json(
          { error: "Pessoas manuais devem ser um array não vazio" },
          { status: 400 }
        );
      }

      // Validar estrutura de cada pessoa manual
      for (const pessoa of pessoasManuais) {
        if (!pessoa.nome || !pessoa.cpf || !pessoa.email || !pessoa.curso) {
          return NextResponse.json(
            { error: "Cada pessoa manual deve ter nome, CPF, email e curso" },
            { status: 400 }
          );
        }
      }
    }

    // Validar emails alternativos se fornecidos
    if (emailAlternativos && typeof emailAlternativos !== "object") {
      return NextResponse.json(
        { error: "Emails alternativos devem ser um objeto" },
        { status: 400 }
      );
    }

    // Converter data de conclusão se fornecida
    let dataFinal: Date | undefined;
    if (dataConclusao) {
      dataFinal = new Date(dataConclusao);
      if (isNaN(dataFinal.getTime())) {
        return NextResponse.json(
          { error: "Data de conclusão inválida" },
          { status: 400 }
        );
      }
    }

    const totalAlunas = temAlunas ? alunaIds.length : 0;
    const totalPessoasManuais = temPessoasManuais ? pessoasManuais.length : 0;

    console.log(
      `Iniciando envio de certificados para ${totalAlunas} aluna(s) e ${totalPessoasManuais} pessoa(s) manual(is)`
    );
    if (emailAlternativos && Object.keys(emailAlternativos).length > 0) {
      console.log(
        `Usando ${
          Object.keys(emailAlternativos).length
        } email(s) alternativo(s)`
      );
    }

    // Processar envio de certificados
    const results = await certificateService.sendCertificates(
      alunaIds || [],
      dataFinal,
      emailAlternativos,
      pessoasManuais
    );

    // Estatísticas dos resultados
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(
      `Certificados enviados: ${successCount} sucessos, ${errorCount} erros`
    );

    return NextResponse.json({
      success: true,
      message: `Certificados processados: ${successCount} enviados com sucesso, ${errorCount} com erro`,
      results,
      statistics: {
        total: results.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("Erro ao enviar certificados:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
        success: false,
      },
      { status: 500 }
    );
  } finally {
    // Não precisamos fechar conexão pois não estamos usando banco externo
    console.log("Processo de envio de certificados finalizado");
  }
}

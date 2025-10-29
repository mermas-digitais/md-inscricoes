import { NextRequest, NextResponse } from "next/server";
import { CertificateService } from "@/lib/services/certificate-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const certificateService = new CertificateService();

  try {
    const body = await request.json();
    const { alunaIds, dataConclusao } = body;

    // Validar dados de entrada
    if (!alunaIds || !Array.isArray(alunaIds) || alunaIds.length === 0) {
      return NextResponse.json(
        { error: "IDs das alunas são obrigatórios" },
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

    console.log(
      `Iniciando envio de certificados para ${alunaIds.length} alunas`
    );

    // Processar envio de certificados
    const results = await certificateService.sendCertificates(
      alunaIds,
      dataFinal
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

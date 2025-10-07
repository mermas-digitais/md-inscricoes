import { type NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services/verification-service";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Usar o serviço de verificação com flag MDX25
    const result = await verificationService.verifyCode(email, code, true);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
      provider: result.provider,
    });
  } catch (error) {
    console.error("Error verifying MDX25 code:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

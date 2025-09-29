import { type NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Use the service to verify code
    const result = await verificationService.verifyCode(email, code, false);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Código de verificação inválido ou expirado" },
        { status: 401 }
      );
    }

    // Para monitores, retornar informações específicas
    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
    });
  } catch (error) {
    console.error("Error in monitor OTP verification:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

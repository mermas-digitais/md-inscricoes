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
        { error: result.error || "Código não encontrado ou inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Erro ao verificar código" },
      { status: 500 }
    );
  }
}

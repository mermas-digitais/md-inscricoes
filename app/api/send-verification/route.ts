import { type NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Use the service to create and send verification code
    const result = await verificationService.createAndSendCode(email, false);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao enviar código de verificação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending verification email:", error);

    // Provide more specific error messages
    let errorMessage = "Erro ao enviar email";
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Erro de conexão com servidor SMTP";
      } else if (error.message.includes("authentication")) {
        errorMessage = "Erro de autenticação SMTP";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Timeout na conexão SMTP";
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

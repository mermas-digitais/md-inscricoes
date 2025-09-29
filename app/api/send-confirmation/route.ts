import { type NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/clients";

// Force Node.js runtime for nodemailer compatibility
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received confirmation email request:", body);

    const { email, nomeCompleto, nomeCurso, cpf } = body;

    if (!email || !nomeCompleto || !nomeCurso || !cpf) {
      console.error("Missing required fields:", {
        email: !!email,
        nomeCompleto: !!nomeCompleto,
        nomeCurso: !!nomeCurso,
        cpf: !!cpf,
      });
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Use the API client to send confirmation email
    const result = await apiClient.sendConfirmationEmail({
      email,
      nomeCompleto,
      nomeCurso,
      cpf,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao enviar email de confirmação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending confirmation email:", error);

    let errorMessage = "Erro ao enviar email de confirmação";
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

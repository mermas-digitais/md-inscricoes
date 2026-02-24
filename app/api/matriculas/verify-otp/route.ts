import { type NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    // TEMPORARY DEV BYPASS - REMOVE LATER
    if (email !== "anamiranda@acad.ifma.edu.br") {
      // Use the service to verify code
      const result = await verificationService.verifyCode(email, code, false);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Código de verificação inválido ou expirado" },
          { status: 401 }
        );
      }
    }

    // Buscar informações do monitor no banco de dados
    const { data: monitor, error: monitorError } = await supabase
      .from("monitores")
      .select("nome, role")
      .eq("email", email.toLowerCase())
      .single();

    if (monitorError || !monitor) {
      console.error("Erro ao buscar dados do monitor:", monitorError);
      return NextResponse.json(
        { error: "Monitor não encontrado" },
        { status: 404 }
      );
    }

    // Para monitores, retornar informações específicas incluindo nome e role
    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
      nome: monitor.nome,
      role: monitor.role || "MONITOR",
    });
  } catch (error) {
    console.error("Error in monitor OTP verification:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

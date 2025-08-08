import { type NextRequest, NextResponse } from "next/server";
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

    // Verificar se o código existe e não expirou
    const { data: verificationCode, error } = await supabase
      .from("verification_codes")
      .select("code, expires_at")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !verificationCode) {
      return NextResponse.json(
        { error: "Código de verificação inválido ou expirado" },
        { status: 401 }
      );
    }

    // Verificar se o email ainda está na lista de monitores
    const { data: monitor } = await supabase
      .from("monitores")
      .select("email, nome")
      .eq("email", email.toLowerCase())
      .single();

    if (!monitor) {
      return NextResponse.json(
        { error: "Email não encontrado na lista de monitores" },
        { status: 401 }
      );
    }

    // Limpar o código usado
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", email.toLowerCase());

    return NextResponse.json({
      success: true,
      email: monitor.email,
      nome: monitor.nome,
    });
  } catch (error) {
    console.error("Error in monitor OTP verification:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

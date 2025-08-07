import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o email existe na tabela monitores
    const { data: monitor, error } = await supabase
      .from("monitores")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !monitor) {
      return NextResponse.json(
        { error: "Email não encontrado na lista de monitores" },
        { status: 404 }
      );
    }

    // Enviar código de verificação por email
    try {
      const verificationResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/send-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: monitor.email }),
        }
      );

      if (!verificationResponse.ok) {
        console.error("Erro ao enviar código de verificação");
        return NextResponse.json(
          { error: "Erro ao enviar código de verificação" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        email: monitor.email,
        message: "Código de verificação enviado com sucesso",
      });
    } catch (verificationError) {
      console.error("Erro ao enviar código de verificação:", verificationError);
      return NextResponse.json(
        { error: "Erro ao enviar código de verificação" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying monitor email:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

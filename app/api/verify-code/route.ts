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

    // Get verification code from database with more specific filtering
    const { data: verificationData, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString()) // Only get non-expired codes
      .order("created_at", { ascending: false }) // Get the most recent one
      .limit(1)
      .single();

    if (error || !verificationData) {
      // Clean up any expired codes for this email
      await supabase
        .from("verification_codes")
        .delete()
        .eq("email", email)
        .lt("expires_at", new Date().toISOString());

      return NextResponse.json(
        { error: "Código não encontrado ou inválido" },
        { status: 400 }
      );
    }

    // Double-check if code has expired (redundant but safer)
    if (new Date() > new Date(verificationData.expires_at)) {
      // Delete expired code
      await supabase
        .from("verification_codes")
        .delete()
        .eq("id", verificationData.id);

      return NextResponse.json({ error: "Código expirado" }, { status: 400 });
    }

    // Code is valid, delete it immediately to prevent reuse and race conditions
    const { error: deleteError } = await supabase
      .from("verification_codes")
      .delete()
      .eq("id", verificationData.id);

    if (deleteError) {
      console.error("Error deleting verification code:", deleteError);
      // Continue anyway, the code was valid
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

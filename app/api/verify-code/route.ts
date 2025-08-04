import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 })
    }

    // Get verification code from database
    const { data: verificationData, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .single()

    if (error || !verificationData) {
      return NextResponse.json({ error: "Código não encontrado ou inválido" }, { status: 400 })
    }

    // Check if code has expired
    if (new Date() > new Date(verificationData.expires_at)) {
      // Delete expired code
      await supabase.from("verification_codes").delete().eq("email", email)

      return NextResponse.json({ error: "Código expirado" }, { status: 400 })
    }

    // Code is valid, delete it to prevent reuse
    await supabase.from("verification_codes").delete().eq("email", email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying code:", error)
    return NextResponse.json({ error: "Erro ao verificar código" }, { status: 500 })
  }
}

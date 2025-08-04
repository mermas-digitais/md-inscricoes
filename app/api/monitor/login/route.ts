import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (code === process.env.MONITOR_ACCESS_CODE) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Código inválido" }, { status: 401 })
  } catch (error) {
    console.error("Error in monitor login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

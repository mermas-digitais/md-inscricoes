import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    // TODO: Verify code against MDX25 database
    // For now, we'll implement a simple validation
    // In the real implementation, you would:
    // 1. Query the MDX25 database for the verification code
    // 2. Check if the code exists and is not expired
    // 3. Check if the code matches the email
    // 4. Mark the code as used

    // Temporary validation - in production, this should come from the database
    const isValidCode = code.length === 6 && /^\d{6}$/.test(code);

    if (!isValidCode) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // TODO: Check if code is expired (should be 10 minutes from creation)
    // TODO: Check if code has already been used
    // TODO: Mark code as used in database

    console.log(`MDX25 Code verification successful for ${email}: ${code}`);

    return NextResponse.json({
      success: true,
      message: "Código verificado com sucesso",
    });
  } catch (error) {
    console.error("Error verifying MDX25 code:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

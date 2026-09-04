import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeToken, TOKEN_EMAIL_VERIFICATION } from "@/lib/tokens";
import { APP_URL } from "@/lib/email";

type VerificationStatus = "ok" | "expired" | "invalid";

function redirectWithStatus(status: VerificationStatus) {
  return NextResponse.redirect(new URL(`/verificar-email?status=${status}`, APP_URL));
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");

    if (!token) {
      return redirectWithStatus("invalid");
    }

    const result = await consumeToken(token, TOKEN_EMAIL_VERIFICATION);

    if (!result.ok) {
      return redirectWithStatus(result.reason === "expired" ? "expired" : "invalid");
    }

    await db.user.update({
      where: { id: result.userId },
      data: { emailVerified: new Date() },
    });

    return redirectWithStatus("ok");
  } catch (error) {
    console.error("Error al verificar el correo electrónico:", error);
    return redirectWithStatus("invalid");
  }
}

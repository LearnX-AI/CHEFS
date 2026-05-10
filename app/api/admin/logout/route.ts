import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  shouldUseSecureAdminCookie,
} from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out successfully." });

  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: shouldUseSecureAdminCookie(),
    maxAge: 0,
    path: "/",
  });

  return response;
}

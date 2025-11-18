import { NextRequest } from "next/server";

export function getCookie(request: NextRequest, name: string): string | null {
  const cookie = request.cookies.get(name);
  return cookie ? cookie.value : null;
}

export function getAllCookies(request: NextRequest): Record<string, string> {
  const cookies = request.cookies.getAll();
  return cookies.reduce((acc, cookie) => {
    acc[cookie.name] = cookie.value;
    return acc;
  }, {} as Record<string, string>);
}

import { NextResponse } from "next/server";

export function setCookie(response: NextResponse, name: string, value: string, maxAge: number) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge,
  });
}

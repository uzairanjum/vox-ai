import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/auth/user";

export async function GET() {
  const user = await getCurrentUser();
  console.log("user -----------------------  ", user);

  if (!user) return NextResponse.json({ id: null }, { status: 401 });

  return NextResponse.json({ id: user.id });
}

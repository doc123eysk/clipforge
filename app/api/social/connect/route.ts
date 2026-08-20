import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.redirect(new URL("/settings?error=no_provider", req.url));
  }

  return NextResponse.redirect(
    new URL(`/settings?error=not_implemented&provider=${provider}`, req.url)
  );
}

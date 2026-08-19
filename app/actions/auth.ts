"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export async function setAuthToken(formData: FormData) {
  const token = formData.get("token") as string;
  if (!token) redirect("/");

  const payload = verifyToken(token);
  if (!payload) redirect("/");

  const store = await cookies();
  store.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  redirect("/");
}

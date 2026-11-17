import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Member } from "./account";

export async function requireAdminPage(): Promise<Member> {
  const cookieStore = await cookies();
  if (!cookieStore.getAll().some(({ name }) => name.includes("session-token"))) redirect("/admin/login");
  const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/session`, {
    headers: { cookie: cookieStore.toString() }, cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองอีกครั้ง");
  const session: { user?: Member } | null = await response.json();
  if (session?.user?.role !== "ADMIN") redirect("/admin/login");
  return session.user;
}

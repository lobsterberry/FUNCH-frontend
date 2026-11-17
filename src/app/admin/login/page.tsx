import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/admin-login";

export const metadata: Metadata = { title: "เข้าสู่ระบบผู้ดูแล | FUNCH Admin" };

export default function Page() { return <AdminLogin />; }

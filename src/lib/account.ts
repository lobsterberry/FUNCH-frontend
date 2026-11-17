export type Member = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success === false) {
    const messages: Record<number, string> = {
      400: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแบบฟอร์ม",
      401: "กรุณาเข้าสู่ระบบอีกครั้ง แล้วกดยืนยันจอง",
      403: "ไม่สามารถทำรายการนี้ได้ กรุณาเข้าสู่ระบบอีกครั้ง",
      409: path.includes("register") ? "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ" : "ข้อมูลซ้ำ หรือรถไม่ว่างในช่วงเวลาที่เลือก กรุณาตรวจสอบอีกครั้ง",
      429: "ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง",
      502: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง",
    };
    const specificMessages: Record<string, string> = {
      "A record with these details already exists": "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ",
      "Car is already booked for these dates": "รถคันนี้ถูกจองในช่วงเวลาที่เลือกแล้ว กรุณาเปลี่ยนวันเวลาหรือเลือกรถคันอื่น",
      "Car is unavailable": "รถคันนี้ไม่เปิดให้จองแล้ว กรุณาเลือกรถคันอื่น",
      "Car details changed; please refresh and try again": "ข้อมูลหรือสถานะรถมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่แล้วลองอีกครั้ง",
      "Pickup must be in the future": "กรุณาเลือกวันและเวลารับรถในอนาคต",
    };
    const message = specificMessages[data?.message]
      || messages[response.status] || "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง";
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export async function currentMember(): Promise<Member | null> {
  const session = await api<{ user?: Member } | null>("/api/auth/session");
  return session?.user ?? null;
}

async function authAction(action: "login" | "logout", credentials = {}) {
  const { csrfToken } = await api<{ csrfToken: string }>("/api/auth/csrf");
  const result = await api<{ url: string }>(`/api/auth/${action}`, { ...credentials, csrfToken });
  const error = new URL(result.url, window.location.origin).searchParams.get("error");
  if (error) throw new ApiError(error === "CredentialsSignin"
    ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    : "ยืนยันการเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 401);
}

export async function signIn(email: string, password: string, scope?: "admin") {
  await authAction("login", { email, password, ...(scope ? { scope } : {}) });
  const member = await currentMember();
  if (!member) throw new ApiError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 401);
  return member;
}

export async function signOut() {
  await authAction("logout");
}

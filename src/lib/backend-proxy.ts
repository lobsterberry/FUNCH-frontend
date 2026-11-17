import { NextRequest, NextResponse } from "next/server";

// Keep authentication on the website's origin, including every HttpOnly cookie.
export async function proxyBackend(request: NextRequest, path: string) {
  const origin = request.headers.get("origin");
  // Next's internal URL may use 0.0.0.0 inside Docker; Host is the browser-facing authority.
  const websiteOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (request.method !== "GET" && origin && origin !== websiteOrigin) {
    return NextResponse.json({ success: false, message: "Origin not allowed" }, { status: 403 });
  }
  const backend = process.env.BACKEND_URL || "http://localhost:5000";
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${backend}${path}`, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.text(),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const response = new NextResponse(upstream.body, { status: upstream.status });
    for (const name of ["content-type", "retry-after", "location"]) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    response.headers.set("Cache-Control", "no-store");
    for (const cookie of upstream.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

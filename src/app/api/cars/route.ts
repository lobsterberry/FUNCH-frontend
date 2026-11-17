import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

export async function POST(request: NextRequest) {
  return proxyBackend(request, "/api/cars");
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search;
    const res = await fetch(`${BACKEND_URL}/api/cars${search}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `Backend returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch cars" },
      { status: 502 },
    );
  }
}

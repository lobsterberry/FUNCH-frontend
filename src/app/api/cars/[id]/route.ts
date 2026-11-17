import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await fetch(`${BACKEND_URL}/api/cars/${id}`, {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch car" },
      { status: 502 },
    );
  }
}

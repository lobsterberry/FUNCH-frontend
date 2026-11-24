"use client";

import { ApiError } from "@/lib/account";
import { useEffect, useState } from "react";
import type { BookingList } from "@/lib/bookings-management";

export function ExamplePage() {
  const [data, setData] = useState<BookingList | null>(null);

  async function bookingRequest<T>(
    path = "",
    method = "GET",
    body?: unknown,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`/api/example${path}`, {
        method: method,
        cache: "no-store",
        credentials: "same-origin",
        headers:
          body === undefined ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 0);
    }

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(result?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล", response.status);
    }
    return result as T;
  }

  useEffect(() => {
    bookingRequest<BookingList>()
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.error("Failed to load booking request:", err);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">ExamplePage</h1>
      {data ? (
        <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto max-h-[500px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser } from "@/lib/auth";

export default function AppHeader() {
  const router = useRouter();
  const user = useMemo(() => getStoredUser(), []);

  const handleLogout = async () => {
    const token = getAccessToken();
    const refresh = getRefreshToken();
    try {
      if (token && refresh) {
        await apiRequest("/api/accounts/logout/", {
          method: "POST",
          token,
          data: { refresh },
        });
      }
    } catch (_) {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <header className="border-b border-amber-100 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-emerald-700">
          SmartSalon
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-emerald-700">
            Dashboard
          </Link>
          <Link href="/appointments" className="hover:text-emerald-700">
            Appointments
          </Link>
          <Link href="/payments" className="hover:text-emerald-700">
            Payments
          </Link>
          {user?.role === "ADMIN" ? (
            <Link href="/admin-schedules" className="hover:text-emerald-700">
              Staff Schedules
            </Link>
          ) : null}
          <button
            onClick={handleLogout}
            className="rounded-md bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
            type="button"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

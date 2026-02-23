"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser, setAuth } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    const refresh = getRefreshToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [profile, dashboard] = await Promise.all([
          apiRequest("/api/accounts/profile/", { token }),
          apiRequest("/api/dashboard/", { token }),
        ]);
        setAuth(token, refresh, profile);
        setUser(profile);
        setSummary(dashboard);
      } catch (_) {
        clearAuth();
        router.push("/login");
      }
    };

    loadData();
  }, [router]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-600">
            {user ? `Welcome ${user.username} (${user.role})` : "Loading user..."}
          </p>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Total Appointments</p>
            <p className="mt-1 text-3xl font-bold">{summary ? summary.appointments_count : "-"}</p>
          </article>
          <article className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Upcoming</p>
            <p className="mt-1 text-3xl font-bold">{summary ? summary.upcoming_count : "-"}</p>
          </article>
          <article className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">Pending Payments</p>
            <p className="mt-1 text-3xl font-bold">{summary ? summary.pending_payments : "-"}</p>
          </article>
        </section>
      </main>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken, getRefreshToken, getStoredUser, setAuth } from "@/lib/auth";

function StatCard({ title, value, tone = "stone" }) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-stone-200 bg-stone-50";
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-stone-900">{value}</p>
    </article>
  );
}

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

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";
  const isCustomer = role === "CUSTOMER";

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">SmartSalon Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-900">Welcome {user ? user.username : "..."}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {role ? `You are logged in as ${role}.` : "Loading profile..."}
          </p>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Appointments" value={summary ? summary.appointments_count : "-"} tone="emerald" />
          <StatCard title="Upcoming Bookings" value={summary ? summary.upcoming_count : "-"} tone="blue" />
          <StatCard title="Today" value={summary ? summary.today_count : "-"} tone="amber" />
          <StatCard title="This Week" value={summary ? summary.week_count : "-"} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <StatCard title="Pending Payments" value={summary ? summary.pending_payments : "-"} tone="amber" />
          <StatCard title="Requested For Approval" value={summary ? summary.requested_payments : "-"} tone="blue" />
        </section>

        <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Quick Actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800" href="/appointments">
              {isCustomer ? "Book Appointment" : "View Appointments"}
            </Link>
            <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800" href="/payments">
              Open Payments
            </Link>
            {isAdmin ? (
              <Link className="rounded-md bg-amber-700 px-4 py-2 text-sm text-white hover:bg-amber-800" href="/admin-schedules">
                Manage Staff Schedules
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="overflow-x-auto rounded-2xl border border-amber-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-stone-900">Recent Appointments</h2>
            <table className="mt-3 min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Staff</th>
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recent_appointments?.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100">
                    <td className="px-2 py-2">{row.customer}</td>
                    <td className="px-2 py-2">{row.staff}</td>
                    <td className="px-2 py-2">{row.service}</td>
                    <td className="px-2 py-2">{new Date(row.datetime).toLocaleString()}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs">{row.status_display}</span>
                    </td>
                  </tr>
                ))}
                {!summary?.recent_appointments?.length ? (
                  <tr>
                    <td className="px-2 py-4 text-stone-500" colSpan={5}>
                      No recent appointments yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </article>

          <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">
              {isAdmin ? "Staff Load Today" : isStaff ? "Your Focus" : "Customer Notes"}
            </h2>
            {isAdmin ? (
              <ul className="mt-3 space-y-2 text-sm">
                {summary?.staff_today_load?.length ? (
                  summary.staff_today_load.map((row) => (
                    <li key={row.staff} className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2">
                      <span>{row.staff}</span>
                      <span className="font-semibold">{row.booked_slots} slots</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-500">No staff bookings today.</li>
                )}
              </ul>
            ) : null}
            {isStaff ? (
              <p className="mt-3 text-sm text-stone-600">
                Check appointments list for your assigned slots and keep requested payments coordinated with admin.
              </p>
            ) : null}
            {isCustomer ? (
              <p className="mt-3 text-sm text-stone-600">
                Book only available 30-minute slots. Submitted payments require admin/staff approval.
              </p>
            ) : null}
          </article>
        </section>
      </main>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth";

const initialForm = {
  staff: "",
  schedule_date: "",
  start_time: "10:00:00",
  end_time: "18:00:00",
  is_available: true,
};

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async (token) => {
    const [staff, scheduleRows] = await Promise.all([
      apiRequest("/api/staff/", { token }),
      apiRequest("/api/staff-schedules/", { token }),
    ]);
    setStaffList(staff);
    setSchedules(scheduleRows);
  };

  useEffect(() => {
    const user = getStoredUser();
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user || user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData(token).catch(() => {
      clearAuth();
      router.push("/login");
    });
  }, [router]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = getAccessToken();
      await apiRequest("/api/staff-schedules/", {
        method: "POST",
        token,
        data: {
          ...form,
          staff: Number(form.staff),
        },
      });
      setForm(initialForm);
      await loadData(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">Staff Schedule Management</h1>
          <p className="mt-1 text-sm text-stone-600">
            Admin can define staff working windows. Customers can book only within these windows.
          </p>
          <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleCreate}>
            <select
              className="rounded-md border border-stone-300 px-3 py-2"
              value={form.staff}
              onChange={(event) => setForm({ ...form, staff: event.target.value })}
              required
            >
              <option value="">Select staff</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name || staff.last_name
                    ? `${staff.first_name} ${staff.last_name}`.trim()
                    : staff.username}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="rounded-md border border-stone-300 px-3 py-2"
              value={form.schedule_date}
              onChange={(event) => setForm({ ...form, schedule_date: event.target.value })}
              required
            />
            <input
              type="time"
              className="rounded-md border border-stone-300 px-3 py-2"
              value={form.start_time.slice(0, 5)}
              onChange={(event) => setForm({ ...form, start_time: `${event.target.value}:00` })}
              required
            />
            <input
              type="time"
              className="rounded-md border border-stone-300 px-3 py-2"
              value={form.end_time.slice(0, 5)}
              onChange={(event) => setForm({ ...form, end_time: `${event.target.value}:00` })}
              required
            />
            <button
              className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-60 sm:col-span-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "Create Schedule"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 overflow-x-auto rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-amber-100 text-stone-600">
                <th className="px-3 py-2">Staff</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-stone-100">
                  <td className="px-3 py-2">{schedule.staff_username}</td>
                  <td className="px-3 py-2">{schedule.schedule_date}</td>
                  <td className="px-3 py-2">{schedule.start_time}</td>
                  <td className="px-3 py-2">{schedule.end_time}</td>
                  <td className="px-3 py-2">{schedule.is_available ? "Yes" : "No"}</td>
                </tr>
              ))}
              {!schedules.length ? (
                <tr>
                  <td className="px-3 py-4 text-stone-500" colSpan={5}>
                    No schedules added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}

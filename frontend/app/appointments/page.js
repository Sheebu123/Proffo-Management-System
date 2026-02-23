"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken, getStoredUser } from "@/lib/auth";

const initialForm = {
  service: "HAIRCUT",
  staff: "",
  date: "",
  appointment_datetime: "",
  notes: "",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const currentUser = useMemo(() => getStoredUser(), []);
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAppointments = async (token) => {
    const data = await apiRequest("/api/appointments/", { token });
    setAppointments(data);
  };

  const loadStaff = async (token) => {
    const data = await apiRequest("/api/staff/", { token });
    setStaffList(data);
  };

  const loadAvailableSlots = async (token, staffId, date) => {
    if (!staffId || !date) {
      setAvailableSlots([]);
      return;
    }
    const response = await apiRequest(`/api/available-slots/?staff_id=${staffId}&date=${date}`, { token });
    setAvailableSlots(response.available_slots || []);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const bootstrap = async () => {
      try {
        await Promise.all([loadAppointments(token), loadStaff(token)]);
      } catch (_) {
        clearAuth();
        router.push("/login");
      }
    };
    bootstrap();
  }, [router]);

  const handleFormChange = async (field, value) => {
    const token = getAccessToken();
    const next = { ...form, [field]: value };
    if (field === "staff" || field === "date") {
      next.appointment_datetime = "";
      setForm(next);
      if (token) {
        try {
          await loadAvailableSlots(token, next.staff, next.date);
        } catch (err) {
          setError(err.message);
        }
      }
      return;
    }
    setForm(next);
  };

  const handleBook = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.appointment_datetime) {
      setError("Select an available slot first.");
      return;
    }
    setLoading(true);
    try {
      const token = getAccessToken();
      await apiRequest("/api/appointments/", {
        method: "POST",
        token,
        data: {
          service: form.service,
          staff: Number(form.staff),
          appointment_datetime: form.appointment_datetime,
          notes: form.notes,
        },
      });
      setForm(initialForm);
      setAvailableSlots([]);
      await loadAppointments(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setError("");
    try {
      const token = getAccessToken();
      await apiRequest(`/api/appointments/${id}/cancel/`, {
        method: "POST",
        token,
      });
      await loadAppointments(token);
    } catch (err) {
      setError(err.message);
    }
  };

  const canBook = currentUser?.role === "CUSTOMER";

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {canBook ? (
          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-stone-900">Book Appointment</h1>
            <p className="mt-1 text-sm text-stone-600">
              Choose staff and date to see free 30-minute slots. Book only from available slots.
            </p>
            <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handleBook}>
              <select
                className="rounded-md border border-stone-300 px-3 py-2"
                value={form.service}
                onChange={(event) => handleFormChange("service", event.target.value)}
              >
                <option value="HAIRCUT">Haircut</option>
                <option value="FACIAL">Facial</option>
                <option value="MANICURE">Manicure</option>
                <option value="PEDICURE">Pedicure</option>
              </select>
              <select
                className="rounded-md border border-stone-300 px-3 py-2"
                value={form.staff}
                onChange={(event) => handleFormChange("staff", event.target.value)}
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
                value={form.date}
                onChange={(event) => handleFormChange("date", event.target.value)}
                required
              />
              <select
                className="rounded-md border border-stone-300 px-3 py-2"
                value={form.appointment_datetime}
                onChange={(event) => handleFormChange("appointment_datetime", event.target.value)}
                required
              >
                <option value="">Select available slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {new Date(slot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </option>
                ))}
              </select>
              <input
                className="rounded-md border border-stone-300 px-3 py-2 sm:col-span-2"
                placeholder="Notes"
                value={form.notes}
                onChange={(event) => handleFormChange("notes", event.target.value)}
              />
              <button
                className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-60 sm:col-span-2"
                type="submit"
                disabled={loading}
              >
                {loading ? "Booking..." : "Book 30-Minute Slot"}
              </button>
            </form>
            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-stone-900">Appointments</h1>
            <p className="mt-1 text-sm text-stone-600">Admin and staff can view and manage appointments below.</p>
            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          </section>
        )}

        <section className="mt-6 overflow-x-auto rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-amber-100 text-stone-600">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Staff</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-stone-100">
                  <td className="px-3 py-2">{appointment.customer_username}</td>
                  <td className="px-3 py-2">{appointment.staff_username || appointment.stylist_name}</td>
                  <td className="px-3 py-2">{appointment.service_display}</td>
                  <td className="px-3 py-2">{new Date(appointment.appointment_datetime).toLocaleString()}</td>
                  <td className="px-3 py-2">{appointment.status_display}</td>
                  <td className="px-3 py-2">
                    {appointment.status === "BOOKED" ? (
                      <button
                        type="button"
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!appointments.length ? (
                <tr>
                  <td className="px-3 py-4 text-stone-500" colSpan={6}>
                    No appointments found.
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

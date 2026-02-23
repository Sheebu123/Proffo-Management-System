"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/api";
import { clearAuth, getAccessToken } from "@/lib/auth";

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchPayments = async () => {
      try {
        const data = await apiRequest("/api/payments/", { token });
        setPayments(data);
      } catch (_) {
        clearAuth();
        router.push("/login");
      }
    };

    fetchPayments();
  }, [router]);

  const markPaid = async (paymentId, method = "CASH") => {
    setError("");
    try {
      const token = getAccessToken();
      await apiRequest(`/api/payments/${paymentId}/mark-paid/`, {
        method: "POST",
        token,
        data: { method, transaction_reference: "" },
      });
      const data = await apiRequest("/api/payments/", { token });
      setPayments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">Payments</h1>
          <p className="mt-1 text-sm text-stone-600">Track pending and completed payments.</p>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="mt-6 overflow-x-auto rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-amber-100 text-stone-600">
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-stone-100">
                  <td className="px-3 py-2">{payment.customer_username}</td>
                  <td className="px-3 py-2">{payment.service_display}</td>
                  <td className="px-3 py-2">{payment.amount}</td>
                  <td className="px-3 py-2">{payment.method_display}</td>
                  <td className="px-3 py-2">{payment.status_display}</td>
                  <td className="px-3 py-2">
                    {payment.status === "PENDING" ? (
                      <button
                        type="button"
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-800"
                        onClick={() => markPaid(payment.id, "CARD")}
                      >
                        Mark Paid
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!payments.length ? (
                <tr>
                  <td className="px-3 py-4 text-stone-500" colSpan={6}>
                    No payments found.
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

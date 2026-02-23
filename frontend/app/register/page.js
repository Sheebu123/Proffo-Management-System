"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiRequest("/api/accounts/register/", {
        method: "POST",
        data: form,
      });
      setAuth(response.access, response.refresh, response.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="w-full rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Register</h1>
        <p className="mt-1 text-sm text-stone-600">Create your SmartSalon account.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            placeholder="First name"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
          />
          <input
            placeholder="Last name"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })}
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiRequest("/api/accounts/login/", {
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
        <h1 className="text-2xl font-semibold text-stone-900">Login</h1>
        <p className="mt-1 text-sm text-stone-600">Access your SmartSalon dashboard.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Username</label>
            <input
              className="w-full rounded-md border border-stone-300 px-3 py-2"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-stone-300 px-3 py-2"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </div>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-stone-600">
          New user?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}

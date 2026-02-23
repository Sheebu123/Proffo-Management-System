export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-12">
      <section className="rounded-2xl border border-amber-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-emerald-700">Login or Register</p>
        <h1 className="mt-2 text-4xl font-bold text-stone-900">SmartSalon Prior Scheduling</h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          SmartSalon Appointment Scheduling This frontend uses Next.js and Tailwind. Data and business logic come from the Django backend API.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/register" className="rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">
            Create Account
          </a>
          <a href="/login" className="rounded-md border border-emerald-700 px-4 py-2 text-emerald-800 hover:bg-emerald-50">
            Login
          </a>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-5xl font-bold tracking-tight text-gold-400">
        OscarPoolVibes
      </h1>
      <p className="mb-8 max-w-md text-center text-lg text-gray-400">
        Pick your Oscar winners, compete with friends, and see who really knows
        film.
      </p>
      <Link
        href="/demo"
        className="rounded-lg bg-gold-500 px-6 py-3 text-lg font-semibold text-gray-950 transition hover:bg-gold-400"
      >
        Try the Demo
      </Link>
    </main>
  );
}

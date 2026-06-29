import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <p className="font-heading text-2xl font-bold tracking-tight text-primary">
          Rivora
        </p>

        {/* 404 number */}
        <p className="mt-6 font-heading text-[120px] font-bold leading-none text-gray-100 select-none">
          404
        </p>

        {/* Message */}
        <h1 className="mt-2 font-heading text-2xl font-bold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
          >
            Search Rivora
          </Link>
        </div>
      </div>
    </div>
  );
}

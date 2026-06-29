"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });

      if (result?.error) {
        setError("Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
          Rivora
        </h1>
        <p className="mt-1 text-sm text-gray-500">Connect • Share • Belong</p>
        <p className="mt-4 font-medium text-gray-700">Reset your password</p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-800">Check your email</p>
            <p className="mt-1 text-sm text-gray-500">
              We sent a password reset link to <strong>{email}</strong>.
              <br />
              The link expires in 1 hour.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-gray-500">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                autoFocus
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 012 0v4a1 1 0 01-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
              Login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

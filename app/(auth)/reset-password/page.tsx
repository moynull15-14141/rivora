"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-red-500">Invalid or expired reset link.</p>
        <Link href="/forgot-password" className="mt-3 block text-sm font-medium text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: err } = await authClient.resetPassword({ newPassword: password, token: token! });

    if (err) {
      setError("This link is invalid or has expired. Please request a new one.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Password updated!</p>
          <p className="mt-1 text-sm text-gray-500">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoFocus
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
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
        disabled={loading || !password || !confirm}
        className="mt-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
          Rivora
        </h1>
        <p className="mt-1 text-sm text-gray-500">Connect • Share • Belong</p>
        <p className="mt-4 font-medium text-gray-700">Choose a new password</p>
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-gray-100" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

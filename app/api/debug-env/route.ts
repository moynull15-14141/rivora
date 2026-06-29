import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    BETTER_AUTH_SECRET:   !!process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL:      process.env.BETTER_AUTH_URL ?? "(not set)",
    GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL:         !!process.env.DATABASE_URL,
    RESEND_API_KEY:       !!process.env.RESEND_API_KEY,
    VERCEL_URL:           process.env.VERCEL_URL ?? "(not set)",
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "(not set)",
    NODE_ENV:             process.env.NODE_ENV,
  });
}

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

const appURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const auth = betterAuth({
  baseURL: appURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Rivora <onboarding@resend.dev>",
          to: user.email,
          subject: "Reset your Rivora password",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#0d9488;margin-bottom:8px;">Reset your password</h2>
              <p style="color:#374151;margin-bottom:24px;">
                Click the button below to reset your Rivora password.<br/>
                This link expires in <strong>1 hour</strong>.
              </p>
              <a href="${url}"
                 style="display:inline-block;background:#0d9488;color:#fff;padding:12px 28px;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Reset Password
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send reset email:", e);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      coverPhoto: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
      isVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      isPrivate: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      lastSeen: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

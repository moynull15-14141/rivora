import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Returns the raw Better Auth session (session + user).
 * Cached per request — safe to call multiple times in one render.
 * Returns null on any error to prevent 500s.
 */
export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.error("[session] getSession failed:", err);
    return null;
  }
});

/**
 * Returns the full user row from the database for the logged-in user.
 * Returns null if unauthenticated or on error.
 */
export const getCurrentUser = cache(async () => {
  try {
    const data = await getSession();
    if (!data?.user) return null;

    const user = await db.user.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        bio: true,
        coverPhoto: true,
        role: true,
        isVerified: true,
        isPrivate: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    console.error("[session] getCurrentUser failed:", err);
    return null;
  }
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

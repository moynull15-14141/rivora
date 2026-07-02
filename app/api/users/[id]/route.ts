import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().max(160, "Bio max 160 characters").nullable().optional(),
  username: z
    .string()
    .min(3, "Username min 3 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores")
    .optional(),
  image: z.string().url().nullable().optional(),
  coverPhoto: z.string().url().nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  if (session.user.id !== id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse("Invalid JSON"), { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  // Check username uniqueness if being changed
  if (parsed.data.username) {
    const existing = await db.user.findFirst({
      where: { username: parsed.data.username, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        errorResponse("Username already taken"),
        { status: 409 }
      );
    }
  }

  const updated = await db.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      coverPhoto: true,
      isPrivate: true,
    },
  });

  return NextResponse.json(successResponse(updated));
}

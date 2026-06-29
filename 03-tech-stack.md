# 03 — Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes / Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| **Auth** | **Better Auth** |
| Storage | Cloudinary / S3 (image upload) |
| Realtime | Socket.io — *V2-এ যোগ হবে, V1-এ নেই* |
| Deployment | Vercel (Frontend+API), Neon/Supabase (DB) |
| State Management | Zustand / React Query |

---

## Auth: Better Auth (NextAuth-এর পরিবর্তে)

NextAuth → Auth.js নাম পরিবর্তন হয়েছে, কিন্তু Rivora-এর জন্য **Better Auth** বেছে নেওয়া হয়েছে।

**কারণ:**
- Prisma Support খুব ভালো
- Session Management সহজ
- OAuth পরে সহজে যোগ করা যায়
- Performance ভালো

**Related Docs:** [04-database](./04-database.md) · [13-git-workflow](./13-git-workflow.md)

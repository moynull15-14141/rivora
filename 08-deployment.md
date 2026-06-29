# 08 — Deployment Plan

| Item | Tool |
|---|---|
| Hosting (App) | Vercel |
| Database Hosting | Neon / Supabase |
| Image Storage | Cloudinary |
| Domain | Custom domain → Vercel DNS |
| CI/CD | GitHub → Vercel Auto Deploy |
| Monitoring | Vercel Analytics |

---

## Environment Variables

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> `SOCKET_SERVER_URL` এখন **বাদ** — V1-এ Chat নেই, V2-এ Realtime Chat যোগ হলে তখন এই variable ফিরিয়ে আনা হবে।

**Related Docs:** [09-roadmap](./09-roadmap.md) · [16-performance](./16-performance.md)

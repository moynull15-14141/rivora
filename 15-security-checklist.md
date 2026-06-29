# 15 — Security Checklist

```
☐ Rate Limiting (Auth + Public API)
☐ Input Validation (Zod/Yup সব API-তে)
☐ Password Hashing (bcrypt/argon2 — Better Auth এটা handle করে)
☐ XSS Protection (output sanitize)
☐ CSRF Protection
☐ SQL Injection Protection (Prisma parametrized queries দিয়ে স্বয়ংক্রিয়ভাবে সুরক্ষিত)
☐ Secure HTTP Headers (helmet/Next config)
☐ Environment Variables কখনো client-এ leak না হওয়া
```

**Related Docs:** [05-api](./05-api.md)

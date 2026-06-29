# 07 — Folder Structure

```
rivora/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── @[username]/
│   │   ├── friends/
│   │   ├── messages/
│   │   ├── notifications/
│   │   └── search/
│   └── api/
│       ├── auth/
│       ├── users/
│       ├── posts/
│       ├── comments/
│       ├── likes/
│       └── friends/
├── components/
│   ├── ui/
│   ├── post/
│   ├── profile/
│   └── navbar/
├── features/
│   ├── auth/
│   ├── feed/
│   ├── friends/
│   └── chat/
├── lib/
│   ├── db.ts
│   ├── auth.ts        # Better Auth config
│   └── socket.ts      # V2
├── hooks/
├── prisma/
│   └── schema.prisma
├── public/
├── types/
└── utils/
```

**Related Docs:** [03-tech-stack](./03-tech-stack.md)




|   |    |--------
|________
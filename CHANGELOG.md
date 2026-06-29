# CHANGELOG

## v1.1 — Update
- ❌ NextAuth বাদ → ✅ **Better Auth** (Prisma support, easier session mgmt, OAuth-ready)
- `Friends` টেবিলে যোগ: `requestedBy`, `acceptedAt`, `createdAt`, `updatedAt`
- `Posts` টেবিলে পরিবর্তন: `image` → `images[]`, যোগ: `visibility`, `location`, `editedAt`
- `Users` টেবিলে যোগ: `username`, `coverPhoto`, `isVerified`, `isPrivate`, `lastSeen`, `role`
- Profile URL pattern চালু: `rivora.com/@username`
- API Routes পুরোপুরি RESTful + plural (`/api/posts`, `/api/friends` ইত্যাদি)
- নতুন Section: UI Components List
- নতুন Section: Roles (`user`, `moderator`, `admin`)
- নতুন Section: Privacy/Visibility (`public`, `friends`, `only_me`)
- `Notifications` টেবিলে যোগ: `actorId`, `entityId`, `entityType`
- `SOCKET_SERVER_URL` env থেকে সরানো হয়েছে (V1-এ Chat নেই, V2-এ ফিরে আসবে)
- Single big markdown file ভেঙে `docs/` ফোল্ডারে ১০+ আলাদা ফাইলে বিভক্ত
- নতুন Section যোগ: Git Workflow, Coding Rules, Security Checklist, Performance Checklist, MVP Checklist

## v1.0 — Initial
- প্রাথমিক Full Project Plan তৈরি

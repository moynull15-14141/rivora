# Rivora — Project Documentation

---

## 1. Project Overview

**Project Name:** Rivora
**Brand Meaning:** River of Connections — মানুষকে সংযুক্ত করার প্রবাহ
**Tagline:** Connect • Share • Belong

**Brand Story:**
Rivora এমন একটি সামাজিক প্ল্যাটফর্ম, যেখানে মানুষ সংযোগ গড়ে তোলে, নিজের গল্প শেয়ার করে এবং একটি কমিউনিটির অংশ হয়ে ওঠে।

**Mission:**
Connect people simply — সহজ, পরিষ্কার এবং অর্থবহ সংযোগ তৈরি করা।

**Target Audience:**
- বয়স: ১৮–৩৫ বছর
- যারা সহজ, লাইটওয়েট, distraction-free সোশ্যাল প্ল্যাটফর্ম চায়

---

## 2. Branding

| Element | Detail |
|---|---|
| Name | Rivora |
| Logo Concept | প্রবাহিত নদীর মতো বাঁকানো লাইন/ওয়েভ shape, minimal |
| Primary Color | Deep Teal `#0E7C7B` |
| Secondary Color | Soft Sand `#F4E9CD` |
| Accent Color | Coral `#FF6B6B` |
| Font (Heading) | Poppins |
| Font (Body) | Inter |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes / Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js / JWT |
| Storage | Cloudinary / S3 (image upload) |
| Realtime | Socket.io (Chat & Notification, Version 2) |
| Deployment | Vercel (Frontend+API), Neon/Supabase (DB) |
| State Management | Zustand / React Query |

---

## 4. Feature Roadmap

### Version 1 (MVP)
- ✔ Signup
- ✔ Login
- ✔ Profile
- ✔ Friend (Add/Remove)
- ✔ Post (Create/Delete)
- ✔ Like
- ✔ Comment

### Version 2
- ✔ Chat (Realtime Messaging)
- ✔ Notification System

### Version 3
- ✔ Story
- ✔ Group
- ✔ Marketplace

---

## 5. Database Design

### Core Tables
- Users
- Posts
- Comments
- Likes
- Friends
- Notifications
- Messages
- Conversations

### Schema Detail

**Users**
| Field | Type |
|---|---|
| id | UUID (PK) |
| name | String |
| email | String (unique) |
| password | String (hashed) |
| avatar | String (URL) |
| bio | String |
| createdAt | DateTime |

**Posts**
| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) |
| content | Text |
| image | String (optional) |
| createdAt | DateTime |

**Comments**
| Field | Type |
|---|---|
| id | UUID (PK) |
| postId | UUID (FK → Posts) |
| userId | UUID (FK → Users) |
| content | Text |
| createdAt | DateTime |

**Likes**
| Field | Type |
|---|---|
| id | UUID (PK) |
| postId | UUID (FK → Posts) |
| userId | UUID (FK → Users) |

**Friends**
| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) |
| friendId | UUID (FK → Users) |
| status | Enum (pending, accepted) |

**Notifications** *(V2)*
| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) |
| type | String |
| isRead | Boolean |
| createdAt | DateTime |

**Conversations / Messages** *(V2)*
| Field | Type |
|---|---|
| id | UUID (PK) |
| user1Id / user2Id | UUID (FK → Users) |
| message | Text |
| createdAt | DateTime |

### ER Diagram (Conceptual)

```
User
 ├──< Posts
 │      ├──< Comments
 │      └──< Likes
 ├──< Friends
 ├──< Notifications
 └──< Conversations ──< Messages
```

---

## 6. Pages / UI Structure

| Page | Route |
|---|---|
| Home / Feed | `/` |
| Login | `/login` |
| Register | `/register` |
| Profile | `/profile/[id]` |
| Friends | `/friends` |
| Messages | `/messages` |
| Notifications | `/notifications` |
| Settings | `/settings` |
| Search | `/search` |

**Wireframe নোট:** প্রতিটি পেজের জন্য আলাদা wireframe Figma/Excalidraw-এ তৈরি করে Documentation-এর সাথে link করে রাখো।

---

## 7. Backend API Planning

| Method | Endpoint | কাজ |
|---|---|---|
| POST | `/api/register` | নতুন ইউজার তৈরি |
| POST | `/api/login` | লগইন + টোকেন |
| GET | `/api/profile/[id]` | প্রোফাইল ডেটা |
| PATCH | `/api/profile/[id]` | প্রোফাইল আপডেট |
| POST | `/api/post` | নতুন পোস্ট |
| GET | `/api/feed` | ফিড লোড |
| DELETE | `/api/post/[id]` | পোস্ট ডিলিট |
| POST | `/api/comment` | কমেন্ট যোগ |
| POST | `/api/like` | লাইক/আনলাইক |
| POST | `/api/friend-request` | ফ্রেন্ড রিকোয়েস্ট |
| PATCH | `/api/friend-request/[id]` | অ্যাকসেপ্ট/রিজেক্ট |
| GET | `/api/notifications` | নোটিফিকেশন লিস্ট |
| GET | `/api/messages/[conversationId]` | মেসেজ হিস্ট্রি |
| POST | `/api/messages` | নতুন মেসেজ পাঠানো |

---

## 8. Folder Structure

```
rivora/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── profile/
│   │   ├── friends/
│   │   ├── messages/
│   │   ├── notifications/
│   │   └── search/
│   └── api/
│       ├── register/
│       ├── login/
│       ├── post/
│       ├── comment/
│       ├── like/
│       └── friend-request/
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
│   ├── auth.ts
│   └── socket.ts
├── hooks/
├── prisma/
│   └── schema.prisma
├── public/
├── types/
└── utils/
```

---

## 9. Development Sequence

```
Authentication
   ↓
Profile
   ↓
Friends
   ↓
Posts
   ↓
Comments / Likes
   ↓
Notifications
   ↓
Search
   ↓
Chat (V2)
   ↓
Deploy
```

---

## 10. Deployment Plan

| Item | Tool |
|---|---|
| Hosting (App) | Vercel |
| Database Hosting | Neon / Supabase |
| Image Storage | Cloudinary |
| Domain | Custom domain → Vercel DNS |
| CI/CD | GitHub → Vercel Auto Deploy |
| Monitoring | Vercel Analytics |

---

## 11. Environment Variables

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SOCKET_SERVER_URL=
JWT_SECRET=
```

---

## 12. Future Roadmap (Post V3)

- Mobile App (React Native)
- AI-based Feed Recommendation
- Video Post Support
- Admin Dashboard / Moderation Panel
- Analytics Dashboard for Users

---

## Document History

| Version | Date | Note |
|---|---|---|
| v1.0 | Initial | Full Project Plan তৈরি |

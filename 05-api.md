# 05 — Backend API Planning (RESTful, Plural Routes)

| Method | Endpoint | কাজ |
|---|---|---|
| POST | `/api/auth/register` | নতুন ইউজার তৈরি |
| POST | `/api/auth/login` | লগইন |
| GET | `/api/users/:username` | প্রোফাইল ডেটা (username ভিত্তিক) |
| PATCH | `/api/users/:id` | প্রোফাইল আপডেট |
| GET | `/api/posts` | ফিড লোড |
| POST | `/api/posts` | নতুন পোস্ট তৈরি |
| PATCH | `/api/posts/:id` | পোস্ট এডিট |
| DELETE | `/api/posts/:id` | পোস্ট ডিলিট |
| GET | `/api/posts/:id/comments` | কমেন্ট লিস্ট |
| POST | `/api/comments` | কমেন্ট যোগ |
| DELETE | `/api/comments/:id` | কমেন্ট ডিলিট |
| POST | `/api/likes` | লাইক |
| DELETE | `/api/likes/:id` | আনলাইক |
| GET | `/api/friends` | ফ্রেন্ড লিস্ট |
| POST | `/api/friends` | ফ্রেন্ড রিকোয়েস্ট পাঠানো |
| PATCH | `/api/friends/:id` | অ্যাকসেপ্ট/রিজেক্ট |
| DELETE | `/api/friends/:id` | আনফ্রেন্ড |
| GET | `/api/notifications` | নোটিফিকেশন লিস্ট *(V2)* |
| GET | `/api/messages/:conversationId` | মেসেজ হিস্ট্রি *(V2)* |
| POST | `/api/messages` | নতুন মেসেজ *(V2)* |

**নিয়ম:** সব Route plural noun (`/posts`, `/comments`, `/friends`...), HTTP verb দিয়ে action আলাদা করা — কোনো verb URL-এ থাকবে না।

**Related Docs:** [04-database](./04-database.md) · [15-security-checklist](./15-security-checklist.md)

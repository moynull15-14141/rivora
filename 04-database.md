# 04 — Database Design

## Core Tables
- Users
- Posts
- Comments
- Likes
- Friends
- Notifications
- Messages
- Conversations

---

### Users

| Field | Type |
|---|---|
| id | UUID (PK) |
| name | String |
| username | String (unique) — Profile URL: `rivora.com/@username` |
| email | String (unique) |
| password | String (hashed) |
| avatar | String (URL) |
| coverPhoto | String (URL) |
| bio | String |
| role | Enum (`user`, `moderator`, `admin`) |
| isVerified | Boolean |
| isPrivate | Boolean |
| lastSeen | DateTime |
| createdAt | DateTime |

---

### Posts

| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) |
| content | Text |
| images | String[] — একাধিক ছবি সাপোর্ট |
| visibility | Enum (`public`, `friends`, `only_me`) |
| location | String (optional) |
| editedAt | DateTime (nullable) |
| createdAt | DateTime |

---

### Comments

| Field | Type |
|---|---|
| id | UUID (PK) |
| postId | UUID (FK → Posts) |
| userId | UUID (FK → Users) |
| content | Text |
| createdAt | DateTime |

---

### Likes

| Field | Type |
|---|---|
| id | UUID (PK) |
| postId | UUID (FK → Posts) |
| userId | UUID (FK → Users) |

---

### Friends

| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) |
| friendId | UUID (FK → Users) |
| status | Enum (`pending`, `accepted`) |
| requestedBy | UUID (FK → Users) — কে রিকোয়েস্ট পাঠিয়েছে |
| acceptedAt | DateTime (nullable) |
| createdAt | DateTime |
| updatedAt | DateTime |

*যোগ করা হয়েছে যাতে পরে Friend Suggestion ও Request History তৈরি করা সহজ হয়।*

---

### Notifications *(V2)*

| Field | Type |
|---|---|
| id | UUID (PK) |
| userId | UUID (FK → Users) — কে notification পাবে |
| actorId | UUID (FK → Users) — কে action নিয়েছে |
| type | String (e.g. `like`, `comment`, `friend_request`) |
| entityId | UUID — কোন post/comment ইত্যাদির id |
| entityType | String (`post`, `comment`, `friend_request`) |
| isRead | Boolean |
| createdAt | DateTime |

**উদাহরণ:** `Moynul liked your post` →
`actorId = Moynul`, `type = like`, `entityType = post`, `entityId = <postId>`

---

### Conversations / Messages *(V2)*

| Field | Type |
|---|---|
| id | UUID (PK) |
| user1Id / user2Id | UUID (FK → Users) |
| message | Text |
| createdAt | DateTime |

---

## ER Diagram (Conceptual)

```
User
 ├──< Posts
 │      ├──< Comments
 │      └──< Likes
 ├──< Friends
 ├──< Notifications
 └──< Conversations ──< Messages
```

**Related Docs:** [05-api](./05-api.md)

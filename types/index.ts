export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type UserRole = "user" | "moderator" | "admin";

export type PostVisibility = "public" | "friends" | "only_me";

export type FriendStatus = "pending" | "accepted";

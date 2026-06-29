"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores"),
  bio: z.string().max(160, "Bio must be under 160 characters").optional(),
});

type EditFormData = z.infer<typeof editSchema>;

type EditableUser = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  image: string | null;
  coverPhoto: string | null;
};

async function uploadImage(file: File, folder: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    let json: { success: boolean; data?: { url: string }; error?: string };
    try {
      json = await res.json();
    } catch {
      return null;
    }
    if (!json.success) {
      throw new Error(json.error ?? "Upload failed");
    }
    return json.data?.url ?? null;
  } catch (err) {
    throw err;
  }
}

export default function EditProfileModal({
  user,
  onClose,
}: {
  user: EditableUser;
  onClose: () => void;
}) {
  const router = useRouter();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(user.coverPhoto);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      username: user.username ?? "",
      bio: user.bio ?? "",
    },
  });

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setCoverFile(file);
      setCoverPreview(previewUrl);
    }
  }

  const onSubmit = async (data: EditFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    let imageUrl = user.image;
    let coverUrl = user.coverPhoto;
    const uploadErrors: string[] = [];

    if (avatarFile) {
      try {
        const url = await uploadImage(avatarFile, "rivora/avatars");
        if (url) imageUrl = url;
      } catch (err) {
        uploadErrors.push(err instanceof Error ? err.message : "Avatar upload failed");
      }
    }

    if (coverFile) {
      try {
        const url = await uploadImage(coverFile, "rivora/covers");
        if (url) coverUrl = url;
      } catch (err) {
        uploadErrors.push(err instanceof Error ? err.message : "Cover upload failed");
      }
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          bio: data.bio || null,
          image: imageUrl,
          coverPhoto: coverUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.error ?? "Failed to save. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (uploadErrors.length > 0) {
        setServerError(`Profile saved, but image upload failed: ${uploadErrors.join(". ")}`);
        setIsSubmitting(false);
        router.refresh();
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-2xl shadow-xl max-h-[90vh]"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-heading text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Cover photo */}
          <div
            className="relative h-36 w-full cursor-pointer bg-gradient-to-br from-primary to-teal-600"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt="Cover preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-sm font-medium text-white">Change cover photo</p>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileChange(e, "cover")}
            />
          </div>

          {/* Avatar */}
          <div className="px-6">
            <div className="-mt-10 mb-4 flex items-end gap-3">
              <div
                className="relative cursor-pointer ring-4 ring-white rounded-full"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar src={avatarPreview} name={user.name} size="xl" />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "avatar")}
                />
              </div>
              <p className="mb-2 text-xs text-gray-400">Click avatar or cover to change</p>
            </div>

            <div className="flex flex-col gap-4 pb-6">
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Username"
                placeholder="johndoe"
                error={errors.username?.message}
                {...register("username")}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell people about yourself..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-xs text-accent">{errors.bio.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-sm text-accent">
                  {serverError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import EditProfileModal from "./EditProfileModal";

type EditableUser = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  image: string | null;
  coverPhoto: string | null;
};

export default function EditProfileButton({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Edit Profile
      </Button>
      {open && (
        <EditProfileModal user={user} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

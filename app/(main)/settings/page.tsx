import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import AccountSettings from "@/components/settings/AccountSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";

export const metadata = { title: "Settings — Rivora" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      <div className="flex flex-col gap-4">
        <NotificationSettings />
        <AppearanceSettings />
        <AccountSettings />
      </div>
    </div>
  );
}

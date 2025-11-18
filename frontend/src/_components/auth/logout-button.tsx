// app/components/LogoutButton.tsx
"use client";

import { logout } from "@/app/auth/actions/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout(); // Call the server action
      // Note: redirect("/") in the action will handle navigation,
      // so this line below won't execute unless redirect fails
      router.push("/");
    } catch (err) {
      console.error(
        "Logout failed:",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}

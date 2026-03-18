"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // Initialize auth state
    initialize();

    // Initialize theme
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("system");
    }
  }, [initialize, setTheme]);

  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}

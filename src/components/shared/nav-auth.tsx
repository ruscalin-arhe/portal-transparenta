"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogIn, Shield } from "lucide-react";

export function NavAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-xs text-muted-foreground px-3 py-2">...</span>
    );
  }

  if (session?.user) {
    return (
      <Link
        href="/admin/sesizari"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
      >
        <Shield className="size-4 shrink-0" aria-hidden="true" />
        Admin
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <LogIn className="size-4 shrink-0" aria-hidden="true" />
      Autentificare
    </Link>
  );
}

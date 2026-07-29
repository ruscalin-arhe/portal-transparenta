import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  FileText,
  MessageSquareWarning,
  Home,
} from "lucide-react";
import { NavAuth } from "@/components/shared/nav-auth";

const nav = [
  { href: "/", label: "Acasa", icon: Home },
  { href: "/proiecte", label: "Proiecte", icon: FolderKanban },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/harta", label: "Harta", icon: Map },
  { href: "/documente", label: "Documente", icon: FileText },
  { href: "/sesizari", label: "Sesizari", icon: MessageSquareWarning },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r bg-card hidden md:flex flex-col">
        <div className="p-5 border-b">
          <Link href="/" className="font-semibold text-lg leading-tight">
            Portal Transparenta
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            Proiecte publice · informare societate civila
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Navigare principala">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t space-y-1">
          <NavAuth />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="font-semibold">
            Portal Transparenta
          </Link>
          <NavAuth />
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}

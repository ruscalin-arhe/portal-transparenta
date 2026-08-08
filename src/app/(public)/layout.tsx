import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  FileText,
  MessageSquareWarning,
  Home,
  ShoppingCart,
} from "lucide-react";
import { NavAuth } from "@/components/shared/nav-auth";

const nav = [
  { href: "/", label: "Acasa", icon: Home },
  { href: "/proiecte", label: "Proiecte", icon: FolderKanban },
  { href: "/pnrr", label: "PNRR", icon: LayoutDashboard },
  { href: "/achizitii", label: "Achizitii", icon: ShoppingCart },
  { href: "/analiza", label: "Analiza", icon: LayoutDashboard },
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
    <div className="bg-background text-foreground flex min-h-screen">
      <aside className="bg-card hidden w-60 flex-col border-r md:flex">
        <div className="border-b p-5">
          <Link href="/" className="text-lg leading-tight font-semibold">
            Portal Transparenta
          </Link>
          <p className="text-muted-foreground mt-1 text-xs">
            Proiecte publice · informare societate civila
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Navigare principala">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t p-3">
          <NavAuth />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:hidden">
          <Link href="/" className="font-semibold">
            Portal Transparenta
          </Link>
          <NavAuth />
        </header>
        <main className="container mx-auto max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

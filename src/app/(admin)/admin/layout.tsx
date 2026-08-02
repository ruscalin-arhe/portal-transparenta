import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin/sesizari" className="font-semibold">
              Admin · Transparenta
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/sesizari" className="hover:underline">
                Sesizari
              </Link>
              <Link href="/admin/pnrr" className="hover:underline">
                PNRR
              </Link>
              <Link href="/admin/trafic" className="hover:underline">
                Trafic
              </Link>
              <Link href="/" className="text-muted-foreground hover:underline">
                Portal public
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{session.user.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Iesire
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

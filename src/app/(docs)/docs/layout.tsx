import Link from "next/link";
import { listDocs } from "@/lib/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = listDocs();
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/docs" className="font-semibold">
            Docs · Transparenta
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin"
              className="text-muted-foreground hover:underline"
            >
              Admin
            </Link>
            <Link href="/" className="text-muted-foreground hover:underline">
              Portal public
            </Link>
          </nav>
        </div>
      </header>
      <div className="container mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1 text-sm">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Cuprins
          </p>
          {docs.map((d) => (
            <Link
              key={d.slug}
              href={d.slug === "index" ? "/docs" : "/docs/" + d.slug}
              className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-2 py-1.5"
            >
              {d.title}
            </Link>
          ))}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

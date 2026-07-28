import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">Pagina nu a fost găsită</h2>
      <p className="text-muted-foreground">
        Resursa pe care o cauți nu există sau a fost mutată.
      </p>
      <Link href="/">
        <Button>Înapoi la pagina principală</Button>
      </Link>
    </div>
  );
}

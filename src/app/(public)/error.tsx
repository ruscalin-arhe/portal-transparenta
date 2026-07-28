"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">A apărut o eroare</h2>
      <p className="text-muted-foreground max-w-md">
        Nu am putut încărca această pagină. Încearcă din nou.
      </p>
      <Button onClick={() => reset()}>Încearcă din nou</Button>
    </div>
  );
}

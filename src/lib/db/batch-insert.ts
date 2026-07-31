import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db/retry";
import type { Prisma } from "@prisma/client";

const CHUNK = 50;

export async function insertPnrrPlatiBatched(
  rows: Prisma.PnrrPlataCreateManyInput[]
) {
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);

    await withRetry(
      () =>
        prisma.$transaction(
          async (tx) => {
            return tx.pnrrPlata.createMany({ data: chunk });
          },
          { maxWait: 10_000, timeout: 30_000 }
        ),
      { label: `batch ${Math.floor(i / CHUNK) + 1}`, retries: 4 }
    );

    inserted += chunk.length;
    console.log(`[batch] ${inserted}/${rows.length}`);
  }

  return inserted;
}

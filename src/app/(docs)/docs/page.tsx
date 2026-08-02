import { notFound } from "next/navigation";
import { getDoc } from "@/lib/docs";
import { Markdown } from "@/lib/markdown";

export default function DocsIndexPage() {
  const doc = getDoc("index");
  if (!doc) notFound();
  return (
    <article>
      <Markdown content={doc.content} />
    </article>
  );
}

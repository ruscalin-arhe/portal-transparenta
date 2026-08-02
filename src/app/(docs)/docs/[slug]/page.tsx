import { notFound } from "next/navigation";
import { getDoc, listDocs } from "@/lib/docs";
import { Markdown } from "@/lib/markdown";

export function generateStaticParams() {
  return listDocs()
    .filter((d) => d.slug !== "index")
    .map((d) => ({ slug: d.slug }));
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "index") notFound();
  const doc = getDoc(slug);
  if (!doc) notFound();
  return (
    <article>
      <Markdown content={doc.content} />
    </article>
  );
}

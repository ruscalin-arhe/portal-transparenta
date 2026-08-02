import fs from "fs";
import path from "path";

export type DocMeta = {
  slug: string;
  title: string;
  description?: string;
  order: number;
};

export type Doc = DocMeta & {
  content: string;
};

const DOCS_DIR = path.join(process.cwd(), "content", "docs");

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { meta: {}, body: trimmed };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) {
    return { meta: {}, body: trimmed };
  }
  const fm = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body };
}

export function listDocs(): DocMeta[] {
  if (!fs.existsSync(DOCS_DIR)) return [];
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const docs: DocMeta[] = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf8");
    const { meta } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title || slug,
      description: meta.description,
      order: meta.order ? Number(meta.order) : 99,
    };
  });

  return docs.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export function getDoc(slug: string): Doc | null {
  const file = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: meta.title || slug,
    description: meta.description,
    order: meta.order ? Number(meta.order) : 99,
    content: body,
  };
}

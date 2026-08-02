import React from "react";

export function Markdown({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="text-2xl font-semibold">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="mt-8 text-xl font-semibold">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={key++} className="mt-6 text-lg font-medium">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul
          key={key++}
          className="text-muted-foreground list-disc space-y-1 pl-5"
        >
          {items.map((t, j) => (
            <li key={j}>{t}</li>
          ))}
        </ul>
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }

    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("* ")
    ) {
      para.push(lines[i]);
      i++;
    }
    nodes.push(
      <p key={key++} className="text-muted-foreground">
        {para.join(" ")}
      </p>
    );
  }

  return <div className="space-y-4 text-sm leading-relaxed">{nodes}</div>;
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import * as XLSX from "xlsx";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const body = await request.json();
    const url = (body.url as string)?.trim();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "URL invalid" }, { status: 400 });
    }

    if (!url.includes("data.gov.ro") && !url.match(/\.(csv|xls|xlsx)(\?|$)/i)) {
      return NextResponse.json(
        { error: "Doar URL-uri data.gov.ro sau .csv/.xls/.xlsx" },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "portal-transparenta/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Download eșuat: ${res.status}` }, { status: 400 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "";
    const isExcel =
      contentType.includes("excel") ||
      contentType.includes("spreadsheet") ||
      url.match(/\.xlsx?$/i);

    let csvPath = join(tmpdir(), `pnrr-${Date.now()}.csv`);

    if (isExcel) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: "",
      }) as any[][];

      // Găsește header-ul real
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = (rows[i] || []).map((c: any) => String(c || "").toLowerCase());
        if (
          row.some((c: string) => c.includes("beneficiar")) &&
          row.some((c: string) => c.includes("suma"))
        ) {
          headerIdx = i;
          break;
        }
      }

      const headers = (rows[headerIdx] || []).map((h: any) =>
        String(h || "")
          .trim()
          .toLowerCase()
          .replace(/^"+|"+$/g, "")
      );
      const dataRows = rows.slice(headerIdx + 1);

      // CSV curat
      const lines: string[] = [headers.join(",")];
      for (const r of dataRows) {
        const vals = headers.map((_, i) => {
          let v = String(r[i] ?? "").trim();
          if (v.includes(",") || v.includes('"') || v.includes("\n")) {
            v = `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        });
        lines.push(vals.join(","));
      }
      await writeFile(csvPath, lines.join("\n"), "utf-8");
      console.log("Header row:", headerIdx, "→", headers);
    } else {
      await writeFile(csvPath, buffer);
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        "pnpm",
        ["exec", "tsx", "scripts/import-pnrr-csv.ts", csvPath, url, "--force"],
        { cwd: process.cwd(), timeout: 50000, env: process.env }
      );
      await unlink(csvPath).catch(() => {});
      return NextResponse.json({
        ok: true,
        message: "Import reușit",
        stdout: stdout?.slice(-1500),
        stderr: stderr?.slice(-500) || null,
      });
    } catch (execErr: any) {
      await unlink(csvPath).catch(() => {});
      return NextResponse.json(
        {
          error: "Import eșuat",
          detail: execErr.message,
          stdout: execErr.stdout?.slice(-800),
          stderr: execErr.stderr?.slice(-800),
        },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("import-url", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}

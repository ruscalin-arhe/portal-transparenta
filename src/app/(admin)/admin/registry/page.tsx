"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Org = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  published: boolean;
  _count?: { dataSources: number };
};

type Ds = {
  id: string;
  slug: string;
  name: string;
  type: string;
  channel: string;
  active: boolean;
  lastRunAt: string | null;
  organization?: { slug: string; name: string };
  _count?: { runs: number };
};

type Run = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsTotal: number | null;
  recordsOk: number | null;
  recordsError: number | null;
  sourceFile: string | null;
  dataSource?: { slug: string; name: string };
  _count?: { pnrrPlati: number };
};

export default function AdminRegistryPage() {
  const [orgs, setOrgs] = useState([] as Org[]);
  const [sources, setSources] = useState([] as Ds[]);
  const [runs, setRuns] = useState([] as Run[]);
  const [error, setError] = useState(null as string | null);
  const [msg, setMsg] = useState(null as string | null);
  const [loading, setLoading] = useState(true);

  const [orgSlug, setOrgSlug] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgShort, setOrgShort] = useState("");

  const [dsSlug, setDsSlug] = useState("");
  const [dsName, setDsName] = useState("");
  const [dsType, setDsType] = useState("csv");
  const [dsOrgId, setDsOrgId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = {
        cache: "no-store" as RequestCache,
        credentials: "same-origin" as RequestCredentials,
      };
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/admin/organizations", opts),
        fetch("/api/admin/data-sources", opts),
        fetch("/api/admin/data-runs", opts),
      ]);
      if (r1.status === 401 || r2.status === 401 || r3.status === 401) {
        setError("Neautorizat — /login");
        return;
      }
      if (!r1.ok || !r2.ok || !r3.ok) {
        const parts: string[] = [];
        if (!r1.ok) parts.push("organizations=" + r1.status);
        if (!r2.ok) parts.push("data-sources=" + r2.status);
        if (!r3.ok) parts.push("data-runs=" + r3.status);
        setError("Eroare API registry: " + parts.join(", "));
        return;
      }
      const o: Org[] = await r1.json();
      const s: Ds[] = await r2.json();
      const r: Run[] = await r3.json();
      setOrgs(o);
      setSources(s);
      setRuns(r);
      if (o.length > 0) {
        setDsOrgId((prev) => prev || o[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: orgSlug.trim(),
        name: orgName.trim(),
        shortName: orgShort.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "HTTP " + res.status);
      return;
    }
    setMsg("Organization creata: " + data.slug);
    setOrgSlug("");
    setOrgName("");
    setOrgShort("");
    await load();
  }

  async function createDs(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await fetch("/api/admin/data-sources", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: dsSlug.trim(),
        name: dsName.trim(),
        type: dsType.trim() || "csv",
        organizationId: dsOrgId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "HTTP " + res.status);
      return;
    }
    setMsg("DataSource creat: " + data.slug);
    setDsSlug("");
    setDsName("");
    await load();
  }

  async function toggleOrgPublished(o: Org) {
    setMsg(null);
    setError(null);
    const res = await fetch("/api/admin/organizations/" + o.id, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !o.published }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "HTTP " + res.status);
      return;
    }
    setMsg("Organization " + o.slug + " published=" + data.published);
    await load();
  }

  async function toggleDsActive(s: Ds) {
    setMsg(null);
    setError(null);
    const res = await fetch("/api/admin/data-sources/" + s.id, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "HTTP " + res.status);
      return;
    }
    setMsg("DataSource " + s.slug + " active=" + data.active);
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Registry</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Organization / DataSource / DataRun — create + list (channel doar in
          DB)
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Se incarca...</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {msg && (
        <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Organization noua</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrg} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="org-slug">slug</Label>
                <Input
                  id="org-slug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="ex: mipe"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="org-name">name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="org-short">shortName</Label>
                <Input
                  id="org-short"
                  value={orgShort}
                  onChange={(e) => setOrgShort(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm">
                Creeaza organization
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">DataSource nou</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createDs} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ds-slug">slug</Label>
                <Input
                  id="ds-slug"
                  value={dsSlug}
                  onChange={(e) => setDsSlug(e.target.value)}
                  placeholder="ex: pnrr-plati"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ds-name">name</Label>
                <Input
                  id="ds-name"
                  value={dsName}
                  onChange={(e) => setDsName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ds-type">type</Label>
                <Input
                  id="ds-type"
                  value={dsType}
                  onChange={(e) => setDsType(e.target.value)}
                  placeholder="csv"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ds-org">organization</Label>
                <select
                  id="ds-org"
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={dsOrgId}
                  onChange={(e) => setDsOrgId(e.target.value)}
                  required
                >
                  <option value="">— alege —</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.slug} — {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" disabled={!dsOrgId}>
                Creeaza data source
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {o.shortName || o.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>slug: {o.slug}</p>
                <p>{o.name}</p>
                <p>sources: {o._count?.dataSources ?? "-"}</p>
                <p>published: {String(o.published)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => toggleOrgPublished(o)}
                >
                  Toggle published
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data sources</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>slug: {s.slug}</p>
                <p>
                  type: {s.type} · channel: {s.channel}
                </p>
                <p>org: {s.organization?.slug ?? "-"}</p>
                <p>runs: {s._count?.runs ?? "-"}</p>
                <p>active: {String(s.active)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => toggleDsActive(s)}
                >
                  Toggle active
                </Button>
                <p>
                  lastRun:{" "}
                  {s.lastRunAt
                    ? new Date(s.lastRunAt).toLocaleString("ro-RO")
                    : "-"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data runs (recente)</h2>
        <div className="space-y-2">
          {runs.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 py-3 text-sm">
                <p className="font-medium">
                  {r.dataSource?.slug ?? "?"} · {r.status}
                </p>
                <p className="text-muted-foreground">
                  total={r.recordsTotal ?? "-"} ok={r.recordsOk ?? "-"} err=
                  {r.recordsError ?? "-"} · plati=
                  {r._count?.pnrrPlati ?? "-"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {r.sourceFile || r.id}
                </p>
              </CardContent>
            </Card>
          ))}
          {!loading && runs.length === 0 && (
            <p className="text-muted-foreground text-sm">Niciun run inca.</p>
          )}
        </div>
      </section>
    </div>
  );
}

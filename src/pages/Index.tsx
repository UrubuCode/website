import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Cpu, Download, Github, Terminal, Gauge, Code2, Sparkles, ArrowRight, ExternalLink } from "lucide-react";

type Releases = {
  sha?: string;
  short_sha?: string;
  title?: string;
  created?: string;
  run_id?: string;
  linux?: string;
  windows?: string;
  macos?: string;
};

type Commit = {
  sha: string;
  short: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

const REPO_URL = "https://github.com/UrubuCode/rts";

const Index = () => {
  const [releases, setReleases] = useState<Releases>({});
  const [commits, setCommits] = useState<Commit[]>([]);
  const [totalCommits, setTotalCommits] = useState<number>(0);

  useEffect(() => {
    fetch("/releases.json").then(r => r.json()).then(setReleases).catch(() => {});
    fetch("/commits.json").then(r => r.json()).then((d) => {
      if (Array.isArray(d)) { setCommits(d); }
      else { setCommits(d.commits || []); setTotalCommits(d.total || 0); }
    }).catch(() => {});
  }, []);

  const downloads = [
    { os: "Linux", url: releases.linux, cmd: "curl -fsSL rts.dev/install.sh | sh" },
    { os: "macOS", url: releases.macos, cmd: "curl -fsSL rts.dev/install.sh | sh" },
    { os: "Windows", url: releases.windows, cmd: "powershell -c \"irm rts.dev/install.ps1 | iex\"" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--brand-glow))] glow">
              <Zap className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span>RTS</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#install" className="hover:text-foreground transition">Install</a>
            <a href="#benchmarks" className="hover:text-foreground transition">Benchmarks</a>
            <a href="#commits" className="hover:text-foreground transition">Activity</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition">Docs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /></a>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))] hover:opacity-90 border-0">
              <a href="#install">Install</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="container relative py-24 md:py-36 text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-3 w-3 mr-1.5" />
            {releases.tag ? `Latest: ${releases.tag}` : "v0.1 — Public preview"}
          </Badge>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6">
            <span className="text-gradient">Ultra fast</span>
            <br />
            <span className="text-gradient-brand">JavaScript runtime.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10">
            RTS compiles JavaScript and TypeScript directly to native machine code.
            No JIT warmup. No interpreter overhead. Just speed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))] hover:opacity-90 border-0 text-base h-12 px-6">
              <a href="#install"><Download className="h-4 w-4 mr-2" /> Install RTS</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-6 border-border/60">
              <a href="https://github.com" target="_blank" rel="noreferrer"><Github className="h-4 w-4 mr-2" /> Star on GitHub</a>
            </Button>
          </div>
          <div className="mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/80 backdrop-blur p-1 shadow-elegant">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-glow))]/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">terminal</span>
            </div>
            <pre className="p-5 text-left font-mono text-sm overflow-x-auto">
<span className="text-muted-foreground">$ </span><span className="text-accent">curl</span> -fsSL rts.dev/install.sh | sh{"\n"}
<span className="text-muted-foreground">$ </span><span className="text-accent">rts</span> run server.ts{"\n"}
<span className="text-[hsl(var(--brand-glow))]">→ compiled in 12ms · listening on :3000</span>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for raw performance</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A modern toolchain that treats your code like the native program it deserves to be.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Cpu, title: "AOT to native", desc: "Ahead-of-time compilation to machine code. No interpreter, no warmup." },
            { icon: Gauge, title: "Sub-ms startup", desc: "Cold starts measured in microseconds. Perfect for edge and serverless." },
            { icon: Code2, title: "TypeScript first", desc: "TS is a first-class citizen. Zero-config, full type inference." },
            { icon: Terminal, title: "Drop-in CLI", desc: "Run, build, test, bundle. Replaces node, tsx, esbuild, jest." },
            { icon: Zap, title: "Web standard APIs", desc: "fetch, Request, WebSocket, streams — works like the browser." },
            { icon: Sparkles, title: "Single binary", desc: "Compile your app to one self-contained executable. Ship it anywhere." },
          ].map((f) => (
            <div key={f.title} className="group relative rounded-2xl border border-border/60 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Get RTS</h2>
          <p className="text-muted-foreground text-lg">
            {releases.tag ? `Latest release: ${releases.tag}` : "Pick your platform and start shipping."}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {downloads.map((d) => (
            <div key={d.os} className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-1">{d.os}</h3>
              <p className="text-xs text-muted-foreground font-mono mb-4">{d.cmd}</p>
              <div className="mt-auto flex flex-col gap-2">
                <Button asChild disabled={!d.url} variant="outline" className="border-border/60">
                  <a href={d.url || "#"} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    {d.url ? "Download binary" : "Coming soon"}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benchmarks */}
      <section id="benchmarks" className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Benchmarks</h2>
          <p className="text-muted-foreground text-lg">HTTP server requests/sec, higher is better.</p>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-border/60 bg-card p-8 space-y-5">
          {[
            { name: "RTS", value: 100, label: "412k req/s" },
            { name: "Bun", value: 78, label: "320k req/s" },
            { name: "Deno", value: 42, label: "175k req/s" },
            { name: "Node.js", value: 28, label: "115k req/s" },
          ].map((b) => (
            <div key={b.name}>
              <div className="flex justify-between mb-1.5 text-sm">
                <span className="font-medium">{b.name}</span>
                <span className="font-mono text-muted-foreground">{b.label}</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))]"
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commits */}
      <section id="commits" className="container py-24">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-2">Latest activity</h2>
            <p className="text-muted-foreground text-lg">Live from the RTS repository.</p>
          </div>
          <Button variant="outline" asChild className="border-border/60">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              View on GitHub <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60 max-w-5xl mx-auto">
          {commits.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No commits yet. The GitHub workflow will populate this list.
            </div>
          )}
          {commits.slice(0, 10).map((c) => (
            <a
              key={c.sha}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition group"
            >
              <code className="text-xs font-mono text-primary shrink-0 w-16">{c.short}</code>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.author} · {c.date && new Date(c.date).toLocaleDateString()}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-hero pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Stop waiting on your runtime.
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join developers shipping native-speed JavaScript today.
            </p>
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-[hsl(var(--brand-glow))] hover:opacity-90 border-0 h-12 px-8">
              <a href="#install"><Download className="h-4 w-4 mr-2" /> Install RTS</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary to-[hsl(var(--brand-glow))]">
              <Zap className="h-3 w-3 text-primary-foreground" fill="currentColor" />
            </div>
            <span>© {new Date().getFullYear()} RTS. MIT Licensed.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition">GitHub</a>
            <a href="#" className="hover:text-foreground transition">Docs</a>
            <a href="#" className="hover:text-foreground transition">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

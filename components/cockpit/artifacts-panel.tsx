"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cockpit/utils";

type FileInfo = { name: string; size: number; mtime: string };

export function ArtifactsPanel({
  kind,
  id,
  pollKey,
}: {
  kind: "debate" | "ask";
  id: string;
  /** Bump this to force a refetch (e.g. debate.updated_ts). */
  pollKey?: string;
}) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [openName, setOpenName] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/artifacts?kind=${kind}&id=${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const { files: list } = (await res.json()) as { files: FileInfo[] };
      setFiles(list);
    } catch {
      /* ignore */
    }
  }, [kind, id]);

  useEffect(() => { load(); }, [load, pollKey]);

  const openFile = async (name: string) => {
    if (openName === name) {
      setOpenName(null);
      return;
    }
    setLoadingFile(true);
    setOpenName(name);
    setContent("");
    try {
      const res = await fetch(
        `/api/artifacts?kind=${kind}&id=${id}&name=${encodeURIComponent(name)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setContent(`(error: HTTP ${res.status})`);
        return;
      }
      const { content: c } = (await res.json()) as { content: string };
      setContent(c);
    } finally {
      setLoadingFile(false);
    }
  };

  if (files.length === 0) return null;

  return (
    <section className="rounded-md border border-[var(--border-1)] bg-[var(--bg-1)] p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[var(--text-3)]">
        <span>ARTIFACTS ({files.length})</span>
        <button
          onClick={load}
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-3)] hover:text-[var(--text-1)]"
          title="Refrescar"
        >
          <RefreshCw size={10} />
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {files.map((f) => {
          const open = openName === f.name;
          return (
            <li key={f.name} className="rounded border border-[var(--border-1)] bg-[var(--bg-2)]">
              <button
                onClick={() => openFile(f.name)}
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[11px] transition",
                  open ? "text-[var(--text-0)]" : "text-[var(--text-1)] hover:text-[var(--text-0)]"
                )}
              >
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <FileText size={12} className="text-[var(--amber-dim)]" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-[10px] text-[var(--text-3)]">
                  {formatSize(f.size)}
                </span>
              </button>
              {open && (
                <div className="border-t border-[var(--border-1)] bg-[var(--bg-0)] p-2">
                  {loadingFile ? (
                    <div className="font-mono text-[10px] text-[var(--text-3)]">cargando…</div>
                  ) : (
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--text-1)]">
                      {content}
                    </pre>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

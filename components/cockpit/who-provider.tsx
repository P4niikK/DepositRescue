"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserId } from "@/lib/cockpit/data";
import { WHO_COOKIE, WHO_HEADER, WHO_STORAGE_KEY, isWho } from "@/lib/cockpit/who";

type WhoCtx = {
  who: UserId;
  setWho: (w: UserId) => void;
  fetchAs: typeof fetch;
};

const Ctx = createContext<WhoCtx | null>(null);

export function WhoProvider({
  children,
  initial = "matu",
}: {
  children: React.ReactNode;
  initial?: UserId;
}) {
  const [who, setWhoState] = useState<UserId>(initial);

  // Hydrate from localStorage once mounted (avoid SSR mismatch).
  useEffect(() => {
    try {
      const v = localStorage.getItem(WHO_STORAGE_KEY);
      if (isWho(v) && v !== who) setWhoState(v);
    } catch {
      /* ignore */
    }
    // Intentionally run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setWho = useCallback((w: UserId) => {
    setWhoState(w);
    try {
      localStorage.setItem(WHO_STORAGE_KEY, w);
    } catch {
      /* ignore */
    }
    // Persist via cookie so SSR on next request sees the right value too.
    document.cookie = `${WHO_COOKIE}=${w}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  // Wrapped fetch that auto-injects the identity header on every request from
  // the cockpit UI. Server endpoints that write to the journal/checklist/etc.
  // honour this header over the env default.
  const fetchAs = useMemo<typeof fetch>(() => {
    return (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (!headers.has(WHO_HEADER)) headers.set(WHO_HEADER, who);
      return fetch(input, { ...init, headers });
    };
  }, [who]);

  return <Ctx.Provider value={{ who, setWho, fetchAs }}>{children}</Ctx.Provider>;
}

export function useWho() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWho must be used inside <WhoProvider>");
  return v;
}

"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserId } from "@/lib/cockpit/data";
import { WHO_COOKIE, WHO_HEADER, WHO_STORAGE_KEY, isWho } from "@/lib/cockpit/who";
import { Avatar } from "./avatar";

const CONFIRMED_KEY = "dr_who_confirmed";

type WhoCtx = {
  who: UserId;
  setWho: (w: UserId) => void;
  /** True once the user explicitly picked (not just a cookie-synced default). */
  hasChosen: boolean;
  fetchAs: typeof fetch;
};

const Ctx = createContext<WhoCtx | null>(null);

export function WhoProvider({
  children,
  initial = "matu",
  hadCookie = false,
}: {
  children: React.ReactNode;
  initial?: UserId;
  /** True if the server saw a dr_who cookie — means the user picked before. */
  hadCookie?: boolean;
}) {
  const [who, setWhoState] = useState<UserId>(initial);
  // Start with whatever the server told us. If the cookie was present, count
  // that as "already chosen" to avoid flashing the modal on every visit.
  const [hasChosen, setHasChosen] = useState<boolean>(hadCookie);

  // Hydrate from localStorage once mounted (avoid SSR mismatch).
  useEffect(() => {
    try {
      const v = localStorage.getItem(WHO_STORAGE_KEY);
      if (isWho(v) && v !== who) setWhoState(v);
      if (localStorage.getItem(CONFIRMED_KEY) === "1") setHasChosen(true);
    } catch {
      /* ignore */
    }
    // Intentionally run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setWho = useCallback((w: UserId) => {
    setWhoState(w);
    setHasChosen(true);
    try {
      localStorage.setItem(WHO_STORAGE_KEY, w);
      localStorage.setItem(CONFIRMED_KEY, "1");
    } catch {
      /* ignore */
    }
    document.cookie = `${WHO_COOKIE}=${w}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const fetchAs = useMemo<typeof fetch>(() => {
    return (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (!headers.has(WHO_HEADER)) headers.set(WHO_HEADER, who);
      return fetch(input, { ...init, headers });
    };
  }, [who]);

  return (
    <Ctx.Provider value={{ who, setWho, hasChosen, fetchAs }}>
      {children}
      {!hasChosen && <IdentityPicker onPick={setWho} />}
    </Ctx.Provider>
  );
}

export function useWho() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWho must be used inside <WhoProvider>");
  return v;
}

function IdentityPicker({ onPick }: { onPick: (w: UserId) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border-2)] bg-[var(--bg-1)] p-6 shadow-2xl">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
          DepositRescue · Cockpit
        </div>
        <h2 className="mt-2 text-[18px] font-semibold text-[var(--text-0)]">
          ¿Quién sos?
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">
          Todo lo que postees en esta sesión se va a atribuir a vos. Podés cambiarlo después desde la topbar.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <IdentityButton who="matu" onPick={onPick} />
          <IdentityButton who="feli" onPick={onPick} />
        </div>
      </div>
    </div>
  );
}

function IdentityButton({ who, onPick }: { who: UserId; onPick: (w: UserId) => void }) {
  const name = who === "matu" ? "Matu" : "Feli";
  const role = who === "matu" ? "tech lead" : "product lead";
  return (
    <button
      onClick={() => onPick(who)}
      className="flex flex-col items-center gap-2 rounded-md border border-[var(--border-2)] bg-[var(--bg-2)] px-4 py-5 transition hover:border-[var(--amber-border)] hover:bg-[var(--amber-soft)]/30"
    >
      <Avatar who={who} size={40} />
      <span className="text-[14px] font-semibold text-[var(--text-0)]">{name}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
        {role}
      </span>
    </button>
  );
}

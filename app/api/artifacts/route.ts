import { NextResponse } from "next/server";
import {
  listArtifacts, readArtifact, type SessionKind,
} from "@/lib/cockpit/sandbox";

export const dynamic = "force-dynamic";

function parseKind(raw: string | null): SessionKind | null {
  return raw === "debate" || raw === "ask" ? raw : null;
}

// IDs are bigserial integers; lock to digits to prevent path traversal
// (e.g. "../../etc") through sessionDir / listArtifacts / readArtifact.
function isValidId(raw: string | null): raw is string {
  return !!raw && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = parseKind(url.searchParams.get("kind"));
  const id = url.searchParams.get("id");
  const name = url.searchParams.get("name");
  if (!kind || !id) {
    return NextResponse.json({ error: "kind and id required" }, { status: 400 });
  }
  if (!isValidId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  if (name) {
    if (name.length > 255) {
      return NextResponse.json({ error: "invalid name" }, { status: 400 });
    }
    const content = readArtifact(kind, id, name);
    if (content === null) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ name, content });
  }

  return NextResponse.json({ files: listArtifacts(kind, id) });
}

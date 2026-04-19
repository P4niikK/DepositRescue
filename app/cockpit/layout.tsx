import { cookies } from "next/headers";
import { Topbar } from "@/components/cockpit/topbar";
import { Sidebar } from "@/components/cockpit/sidebar";
import { Rail } from "@/components/cockpit/rail";
import { WhoProvider } from "@/components/cockpit/who-provider";
import { WHO_COOKIE, isWho } from "@/lib/cockpit/who";

export default async function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await cookies();
  const v = c.get(WHO_COOKIE)?.value;
  const initial = isWho(v) ? v : "matu";

  return (
    <WhoProvider initial={initial}>
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
          <Rail />
        </div>
      </div>
    </WhoProvider>
  );
}

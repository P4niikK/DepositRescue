import { Topbar } from "@/components/cockpit/topbar";
import { Sidebar } from "@/components/cockpit/sidebar";
import { Rail } from "@/components/cockpit/rail";

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
        <Rail />
      </div>
    </div>
  );
}

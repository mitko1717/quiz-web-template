import { AuthGate } from "@/components/AuthGate";
import { StatsPageContent } from "@/components/StatsPageContent";

export const metadata = { title: "Stats - Capitalz Quiz" };

export default function StatsPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <AuthGate>
        <StatsPageContent />
      </AuthGate>
    </main>
  );
}

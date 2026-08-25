import { AuthGate } from "@/components/AuthGate";
import { SettingsPageContent } from "@/components/SettingsPageContent";

export const metadata = { title: "Settings - Capitalz Quiz" };

export default function SettingsPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <AuthGate>
        <SettingsPageContent />
      </AuthGate>
    </main>
  );
}

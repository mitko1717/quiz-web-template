import { AdminPageContent } from "@/components/AdminPageContent";
import { AuthGate } from "@/components/AuthGate";

export const metadata = { title: "Admin — Capitalz Quiz" };

export default function AdminPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <AuthGate adminOnly>
        <AdminPageContent />
      </AuthGate>
    </main>
  );
}

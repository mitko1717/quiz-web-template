import { AdminPageContent } from "@/components/AdminPageContent";
import { AuthGate } from "@/components/AuthGate";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Admin — ${topicConfig.appName}` };

export default function AdminPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <AuthGate adminOnly>
        <AdminPageContent />
      </AuthGate>
    </main>
  );
}

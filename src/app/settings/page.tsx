import { SettingsPageContent } from "@/components/SettingsPageContent";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Settings - ${topicConfig.appName}` };

export default function SettingsPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <SettingsPageContent />
    </main>
  );
}
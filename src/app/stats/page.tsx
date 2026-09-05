import { StatsPageContent } from "@/components/StatsPageContent";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Stats - ${topicConfig.appName}` };

export default function StatsPage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <StatsPageContent />
    </main>
  );
}
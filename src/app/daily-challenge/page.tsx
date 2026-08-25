import { AuthGate } from "@/components/AuthGate";
import { DailyChallengePageContent } from "@/components/DailyChallengePageContent";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Daily Challenge - ${topicConfig.appName}` };

export default function DailyChallengePage() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <AuthGate>
        <DailyChallengePageContent />
      </AuthGate>
    </main>
  );
}

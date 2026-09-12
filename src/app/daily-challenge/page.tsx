import { DailyChallengePageContent } from "@/components/DailyChallengePageContent";
import { PageWrapper } from "@/components/PageWrapper";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Daily Challenge - ${topicConfig.appName}` };

export default function DailyChallengePage() {
  return (
    <PageWrapper>
      <DailyChallengePageContent />
    </PageWrapper>
  );
}
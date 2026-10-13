import { DailyChallengePageContent } from "@/components/DailyChallengePageContent";
import { PageWrapper } from "@/components/PageWrapper";
import { AdsgramBanner } from "@/components/AdsgramBanner";
import { topicConfig } from "@/lib";

export const metadata = { title: `Daily Challenge - ${topicConfig.appName}` };

export default function DailyChallengePage() {
  return (
    <PageWrapper>
      <DailyChallengePageContent />
      <AdsgramBanner className="mt-4" placement="daily-challenge" />
    </PageWrapper>
  );
}
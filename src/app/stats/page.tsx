import { PageWrapper } from "@/components/PageWrapper";
import { StatsPageContent } from "@/components/StatsPageContent";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Stats - ${topicConfig.appName}` };

export default function StatsPage() {
  return (
    <PageWrapper>
      <StatsPageContent />
    </PageWrapper>
  );
}
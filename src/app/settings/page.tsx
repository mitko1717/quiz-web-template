import { PageWrapper } from "@/components/PageWrapper";
import { SettingsPageContent } from "@/components/SettingsPageContent";
import { topicConfig } from "@/lib/topic.config";

export const metadata = { title: `Settings - ${topicConfig.appName}` };

export default function SettingsPage() {
  return (
    <PageWrapper>
      <SettingsPageContent />
    </PageWrapper>
  );
}
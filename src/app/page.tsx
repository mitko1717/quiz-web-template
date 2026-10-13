import { PageWrapper } from "@/components/PageWrapper";
import { QuizPlayground } from "@/components/QuizPlayground";
import { AdsgramBanner } from "@/components/AdsgramBanner";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <PageWrapper>
      <QuizPlayground />
      <AdsgramBanner className="mt-4" />
    </PageWrapper>
  );
}
import { PageWrapper } from "@/components/PageWrapper";
import { QuizPlayground } from "@/components/QuizPlayground";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <PageWrapper>
      <QuizPlayground />
    </PageWrapper>
  );
}
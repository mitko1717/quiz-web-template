import { QuizPlayground } from "@/components/QuizPlayground";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <QuizPlayground />
    </main>
  );
}
"use client";
import { useState, type KeyboardEvent } from "react";
import { BodyText, SectionLabel } from "@/components/common/SectionLabel";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/table";
import { useI18n } from "@/components/I18nProvider";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/button";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/common/Skeleton";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { AchievementScope, type AchievementProgressResponse, type DifficultyLevel, type UserAnswerStatsByDifficulty } from "@/lib/types";
import type {
  ActiveDifficultyPanelProps,
  DifficultyStatsTableProps,
  ErrorStateProps,
  GlobalStatsPanelProps,
  HeroPanelProps,
  PanelShellProps,
  StatPairProps,
  SummaryGridProps,
  SummaryMetricCardProps,
  UnlockLevelCardProps,
  UnlockLevelsGridProps,
  UserStatsPanelProps
} from "./UserStatsPanel.types";
import { formatPercent } from "@/lib/utils";
import { Accordion } from "./common/Accordion";
import { topicConfig } from "@/lib/topic.config";

function PanelShell({ children, variant = "default" }: PanelShellProps) {
  return (
    <section className={["relative w-full rounded-2xl border bg-base-800 p-4 sm:p-5", variant === "error" ? "border-pastel-coral/50" : "border-base-600"].join(" ")}>
      {children}
    </section>
  );
}

function RefreshButton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { t } = useI18n();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={t('common_refresh')}
      title={t('common_refresh')}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-greenDim/45 bg-accent-green/10 p-0 leading-none text-accent-green"
    >
      <RefreshIcon spinning={refreshing} />
    </Button>
  );
}

function LoadingState() {
  return (
    <PanelShell>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-accent-greenDim/25 bg-base-700/30 p-4">
          <SkeletonText className="w-28" />
          <SkeletonBlock className="mt-3 h-12 w-28" />
          <SkeletonText className="mt-3 w-36" />
          <SkeletonText className="mt-4 w-full" />
          <SkeletonText className="mt-2 w-3/4" />
          <div className="mt-4 rounded-xl border border-base-600/80 bg-base-900/30 p-4">
            <SkeletonText className="w-40" />
            <SkeletonText className="mt-3 w-3/4" />
            <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-base-600 bg-base-700/50 p-3">
              <SkeletonText className="w-20" />
              <SkeletonBlock className="mt-2 h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-accent-greenDim/25 bg-accent-green/5 p-4">
        <SkeletonText className="w-40" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="mt-4 hidden space-y-2 md:block">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-11 rounded-xl" />)}
      </div>
    </PanelShell>
  );
}

function ErrorState({ error }: ErrorStateProps) {
  return (
    <PanelShell variant="error">
      <div className="rounded-xl border border-pastel-coral/40 bg-pastel-coral/10 p-4 text-sm text-pastel-coral">
        {error}
      </div>
    </PanelShell>
  );
}

function ProgressBar({ progress, tone }: { progress: number; tone: "accent" | "muted" }) {
  const percentage = Math.min(100, Math.max(0, progress * 100));
  
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-base-600">
      <div 
        className={["h-full rounded-full transition-all duration-300", tone === "accent" ? "bg-accent-green" : "bg-base-400"].join(" ")} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function SummaryMetricCard({ label, value, valueClassName }: SummaryMetricCardProps) {
  return (
    <div className="rounded-xl border border-base-600 bg-base-700/50 p-3 text-ink-200">
      <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className={["mt-1 text-lg font-semibold", valueClassName].join(" ")}>{value}</p>
    </div>
  );
}

function StatPair({ label, value }: StatPairProps) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-lg font-semibold text-ink-100">{value}</p>
    </div>
  );
}

function GlobalStatsPanel({ stats }: GlobalStatsPanelProps) {
  const { t } = useI18n();

  return (
    <div className="mb-4 rounded-2xl border border-base-600 bg-base-700/40 p-4">
      <SectionLabel>{t('global_stats_label')}</SectionLabel>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPair label={t('global_stats_insight_points')} value={stats.totalInsightPoints} />
        <StatPair label={t('global_stats_best_streak')} value={stats.bestStreakOverall} />
        <StatPair label={t('global_stats_answers')} value={stats.totalAttempts} />
        <StatPair label={t('global_stats_accuracy')} value={formatPercent(stats.accuracy)} />
      </div>

      {stats.byTopic.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stats.byTopic.map((topic) => (
            <div key={topic.topicId} className="rounded-xl border border-base-600 bg-base-900/30 p-3 text-xs text-ink-300">
              <p className="text-ink-500">{topic.name}</p>
              <p className="mt-1 text-ink-100">
                {topic.correctAttempts}/{topic.totalAttempts} · {formatPercent(topic.accuracy)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AchievementsPanel({ achievements }: { achievements: AchievementProgressResponse[] }) {
  const { t } = useI18n();
  if (achievements.length === 0) return null;

  const globalAchievements = achievements.filter((a) => a.scope === AchievementScope.GLOBAL);
  const topicAchievements = achievements.filter((a) => a.scope === AchievementScope.TOPIC);

  // Don't link to the game the user is already in. gameLink values come from the
  // Game registry's tgBotLink (e.g. "https://t.me/planetz_quiz_bot"); the current
  // app's own bot is topicConfig.telegramBotUsername — compare host+path, ignoring
  // any query string (referral links append ?start=ref_XXX).
  const currentBotLink = topicConfig.telegramBotUsername ? `https://t.me/${topicConfig.telegramBotUsername}` : null;

  function isCurrentGameLink(gameLink: string): boolean {
    if (!currentBotLink) return false;
    const normalize = (url: string) => url.split('?')[0].replace(/\/$/, '').toLowerCase();
    return normalize(gameLink) === normalize(currentBotLink);
  }

  function GameLinkButton({ href }: { href: string }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('achievements_play_game')}
        title={t('achievements_play_game')}
        onClick={(event) => event.stopPropagation()}
        className="group inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-greenDim/50 bg-accent-green/10 text-sm text-accent-green transition-all duration-200 hover:scale-110 hover:border-accent-greenDim hover:bg-accent-green/20 hover:shadow-[0_0_10px_rgba(34,197,94,0.45)]"
      >
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">🚀</span>
      </a>
    );
  }

  function renderAchievement(a: AchievementProgressResponse) {
    const unlocked = a.unlockedAt !== null;
    const currentValue = Number(a.currentValue);
    const threshold = Number(a.threshold);
    const progress = threshold === 0 ? 1 : Math.min(1, currentValue / threshold);

    return (
      <div
        key={a.achievementId}
        className={["rounded-xl border p-2", unlocked ? "border-accent-greenDim/40 bg-accent-green/10" : "border-base-600 bg-base-700/35"].join(" ")}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-ink-100">{a.name ? `${a.name.charAt(0).toUpperCase()}${a.name.slice(1)}` : a.name}</p>
            {a.gameLink && !isCurrentGameLink(a.gameLink) ? <GameLinkButton href={a.gameLink} /> : null}
          </div>
          <p className={["shrink-0", unlocked ? "text-xs text-accent-green" : "text-xs text-ink-500"].join(" ")}>
            {unlocked ? t('achievements_unlocked') : `${currentValue}/${threshold}`}
          </p>
        </div>

        {a.description ? <p className="mt-1 text-xs text-ink-400">{a.description}</p> : null}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-base-600">
          <div 
            className={["h-full rounded-full transition-all duration-300", unlocked ? "bg-accent-green" : "bg-base-400"].join(" ")} 
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  const items = [];

  if (globalAchievements.length > 0) {
    items.push({
      id: AchievementScope.GLOBAL,
      title: t('achievements_label'),
      content: (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {globalAchievements.map(renderAchievement)}
        </div>
      )
    });
  }

  if (topicAchievements.length > 0) {
    const topicGroups = new Map<string, { name: string; achievements: AchievementProgressResponse[] }>();

    for (const achievement of topicAchievements) {
      const key = achievement.topicId ?? "unknown";
      if (!topicGroups.has(key)) topicGroups.set(key, { name: achievement.topicName ?? key, achievements: [] });
      topicGroups.get(key)!.achievements.push(achievement);
    }

    items.push({
      id: AchievementScope.TOPIC,
      title: t('achievements_topic_label'),
      content: (
        <Accordion
          items={Array.from(topicGroups.entries()).map(([topicId, group]) => ({
            id: topicId,
            title: group.name,
            content: (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 scrollbar-hide">
                {group.achievements.map(renderAchievement)}
              </div>
            )
          }))}
        />
      )
    });
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-base-600 bg-base-700/40">
      <Accordion items={items} className="max-h-[460px] min-h-[52px] scrollbar-hide" />
    </div>
  );
}

function HeroPanel({ stats, refreshing, onRefresh }: HeroPanelProps) {
  const { t } = useI18n();
  const nextUnlock = stats.progression.nextDifficultyToUnlock;
  const nextUnlockStatus = nextUnlock ? stats.progression.levels.find((row) => row.difficultyLevel === nextUnlock) ?? null : null;;

  return (
    <div className="rounded-2xl border border-accent-greenDim/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent-green)_18%,transparent),color-mix(in_srgb,var(--color-base-900)_30%,transparent))] p-3">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>{t('stats_label')}</SectionLabel>
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <h2 className="text-3xl font-semibold text-ink-100 sm:text-5xl">{stats.totalInsightPoints}</h2>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent-green">{t('stats_points_suffix')}</p>
      </div>
      <BodyText>{t('stats_summary', { answers: stats.totalAttempts, accuracy: formatPercent(stats.accuracy), streak: stats.bestStreakOverall })}</BodyText>

      <div className="mt-4 rounded-xl border border-base-600/80 bg-base-900/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{t('stats_progress_next')}</p>
            <p className="mt-1 text-sm text-ink-200">
              {nextUnlockStatus
                ? t('stats_unlock_desc', {
                    level: nextUnlockStatus.difficultyLevel,
                    required: nextUnlockStatus.requiredCorrectAnswers,
                    previous: nextUnlockStatus.difficultyLevel - 1,
                  })
                : t('stats_all_unlocked')}
            </p>
          </div>
          {nextUnlockStatus ? (
            <p className="text-sm font-semibold text-ink-100">
              {nextUnlockStatus.correctAnswersTowardsUnlock}/{nextUnlockStatus.requiredCorrectAnswers}
            </p>
          ) : null}
        </div>

        <ProgressBar progress={nextUnlockStatus?.progress ?? 1} tone="accent" />
      </div>
    </div>
  );
}

function SummaryGrid({ stats }: SummaryGridProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <SummaryMetricCard label={t('stats_correct')} value={stats.correctAttempts} valueClassName="text-pastel-mint" />
      <SummaryMetricCard label={t('stats_wrong')} value={stats.wrongAttempts} valueClassName="text-pastel-coral" />
      <SummaryMetricCard label={t('stats_skips')} value={stats.skipCount} valueClassName="text-pastel-amber" />
      <SummaryMetricCard label={t('stats_hints_used')} value={stats.hintsUsedCount} valueClassName="text-ink-100" />
    </div>
  );
}

function ActiveDifficultyPanel({ activeLevel }: ActiveDifficultyPanelProps) {
  const { t } = useI18n();

  return (
    <div className="mt-4 rounded-2xl border border-accent-greenDim/40 bg-accent-green/10 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-accent-green">{t('stats_current_focus')}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPair label={t('stats_level')} value={activeLevel.difficultyLevel} />
        <StatPair label={t('stats_points')} value={activeLevel.insightPoints} />
        <StatPair label={t('stats_correct')} value={activeLevel.correctAttempts} />
        <StatPair label={t('stats_wrong')} value={activeLevel.wrongAttempts} />
        <StatPair label={t('stats_accuracy')} value={formatPercent(activeLevel.accuracy)} />
        <StatPair label={t('stats_streak')} value={`${activeLevel.currentStreak} / ${t('stats_best_streak').toLowerCase()} ${activeLevel.bestStreak}`} />
      </div>
    </div>
  );
}

function DifficultyStatsTable({ stats, activeDifficulty, onOpenDetails }: DifficultyStatsTableProps) {
  const { t } = useI18n();

  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>, difficultyLevel: DifficultyLevel) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails(difficultyLevel);
    }
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-ink-400">{t('stats_details_hint')}</p>
      <div className="grid gap-2 md:hidden">
        {stats.byDifficulty.map((row) => (
          <button
            key={row.difficultyLevel}
            type="button"
            onClick={() => onOpenDetails(row.difficultyLevel)}
            className={[
              "rounded-xl border bg-base-700/45 p-3 text-left text-sm text-ink-200 transition-colors hover:border-accent-greenDim/70 hover:bg-base-700/60",
              row.difficultyLevel === activeDifficulty ? "border-accent-greenDim/70" : "border-base-600"
            ].join(" ")}
            aria-label={t('stats_detail_open_for_level', { level: row.difficultyLevel })}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-ink-100">{t('difficulty_level', { level: row.difficultyLevel })}</p>
              <p className="text-xs text-ink-400">{formatPercent(row.accuracy)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>{t('stats_points')}: {row.insightPoints}</p>
              <p>{t('stats_answers')}: {row.totalAttempts}</p>
              <p>{t('stats_correct')}: {row.correctAttempts}</p>
              <p>{t('stats_wrong')}: {row.wrongAttempts}</p>
              <p>{t('stats_skips')}: {row.skipCount}</p>
              <p>{t('stats_hints_used')}: {row.hintsUsedCount}</p>
              <p>{t('stats_best_streak')}: {row.bestStreak}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="edge-safe-scroll hidden overflow-x-auto md:block">
        <Table>
          <TableHead>
            <TableRow className="text-left text-ink-500">
              <TableHeaderCell>{t('stats_level')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_points')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_answers')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_correct')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_wrong')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_accuracy')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_skips')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_hints_used')}</TableHeaderCell>
              <TableHeaderCell>{t('stats_best_streak')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.byDifficulty.map((row) => (
              <TableRow
                key={row.difficultyLevel}
                onClick={() => onOpenDetails(row.difficultyLevel)}
                onKeyDown={(event) => onKeyDown(event, row.difficultyLevel)}
                role="button"
                tabIndex={0}
                aria-label={t('stats_detail_open_for_level', { level: row.difficultyLevel })}
                className={[
                  "cursor-pointer rounded-xl border border-base-600 bg-base-700/45 text-ink-200 transition-colors hover:border-accent-greenDim/70 hover:bg-base-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-greenDim",
                  row.difficultyLevel === activeDifficulty ? "outline outline-1 outline-accent-greenDim" : "",
                ].join(" ")}
              >
                <TableCell className="font-semibold text-ink-100">{row.difficultyLevel}</TableCell>
                <TableCell>{row.insightPoints}</TableCell>
                <TableCell>{row.totalAttempts}</TableCell>
                <TableCell>{row.correctAttempts}</TableCell>
                <TableCell>{row.wrongAttempts}</TableCell>
                <TableCell>{formatPercent(row.accuracy)}</TableCell>
                <TableCell>{row.skipCount}</TableCell>
                <TableCell>{row.hintsUsedCount}</TableCell>
                <TableCell>{row.bestStreak}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface DifficultyStatsDetailModalProps {
  row: UserAnswerStatsByDifficulty;
  isOpen: boolean;
  onClose: () => void;
}

function DifficultyStatsDetailModal({ row, isOpen, onClose }: DifficultyStatsDetailModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t('stats_detail_close')}
      title={t('stats_detail_title', { level: row.difficultyLevel })}
      description={t('stats_detail_description')}
      maxWidthClassName="max-w-lg"
      footer={(
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('stats_detail_close')}
          </Button>
        </div>
      )}
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <StatPair label={t('stats_points')} value={row.insightPoints} />
        <StatPair label={t('stats_answers')} value={row.totalAttempts} />
        <StatPair label={t('stats_correct')} value={row.correctAttempts} />
        <StatPair label={t('stats_wrong')} value={row.wrongAttempts} />
        <StatPair label={t('stats_skips')} value={row.skipCount} />
        <StatPair label={t('stats_hints_used')} value={row.hintsUsedCount} />
        <StatPair label={t('stats_accuracy')} value={formatPercent(row.accuracy)} />
        <StatPair label={t('stats_streak')} value={row.currentStreak} />
        <StatPair label={t('stats_best_streak')} value={row.bestStreak} />
      </div>
    </Modal>
  );
}

function UnlockLevelCard({ level }: UnlockLevelCardProps) {
  const { t } = useI18n();
  
  return (
    <div className={["rounded-xl border p-1.5", level.unlocked ? "border-accent-greenDim/40 bg-accent-green/10" : "border-base-600 bg-base-700/35"].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-100">{t('difficulty_level', { level: level.difficultyLevel })}</p>
        <p className={level.unlocked ? "text-xs text-accent-green" : "text-xs text-ink-500"}>
          {level.unlocked ? t('stats_unlock_open') : t('stats_unlock_locked')}
        </p>
      </div>
      <ProgressBar progress={level.progress} tone={level.unlocked ? "accent" : "muted"} />
      <p className="mt-2 text-xs text-ink-400">
        {level.difficultyLevel === 1
          ? t('stats_starter_level')
          : t('stats_unlock_progress', { current: level.correctAnswersTowardsUnlock, required: level.requiredCorrectAnswers, previous: level.difficultyLevel - 1 })}
      </p>
    </div>
  );
}

function UnlockLevelsGrid({ stats }: UnlockLevelsGridProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.progression.levels.map((level) => (
        <UnlockLevelCard key={level.difficultyLevel} level={level} />
      ))}
    </div>
  );
}

export function UserStatsPanel({ stats, globalStats, achievements, loading, error, offline = false, activeDifficulty, refreshing, onRefresh }: UserStatsPanelProps) {
  const { t } = useI18n();

  const [detailDifficulty, setDetailDifficulty] = useState<DifficultyLevel | null>(null);
  if (loading && !stats) {
    return (
      <>
        <LoadingState />
        {offline ? <OfflineStateHint className="mt-3" /> : null}
      </>
    );
  }
  if (error && !stats) return <ErrorState error={error} />;
  if (!stats) return null;

  const activeLevel = stats.byDifficulty.find((row) => row.difficultyLevel === activeDifficulty) ?? stats.byDifficulty[0];
  const detailRow = detailDifficulty === null ? null : stats.byDifficulty.find((row) => row.difficultyLevel === detailDifficulty) ?? null;

  return (
    <PanelShell>
      <div className="absolute right-6 top-6 z-10 sm:right-8 sm:top-8">
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </div>
      {globalStats ? <GlobalStatsPanel stats={globalStats} /> : null}
      {achievements ? <AchievementsPanel achievements={achievements} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <HeroPanel stats={stats} refreshing={refreshing} onRefresh={onRefresh} />
        <SummaryGrid stats={stats} />
      </div>

      {activeLevel ? <ActiveDifficultyPanel activeLevel={activeLevel} /> : null}
      <DifficultyStatsTable
        stats={stats}
        activeDifficulty={activeDifficulty}
        onOpenDetails={(difficultyLevel) => setDetailDifficulty(difficultyLevel)}
      />
      <UnlockLevelsGrid stats={stats} />
      {detailRow ? (
        <DifficultyStatsDetailModal row={detailRow} isOpen={detailRow !== null} onClose={() => setDetailDifficulty(null)} />
      ) : null}

      {error ? <p className="mt-4 text-xs text-pastel-coral">{t('stats_refresh_warning', { error })}</p> : null}
    </PanelShell>
  );
}
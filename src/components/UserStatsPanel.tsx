"use client";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/common/table";
import { useI18n } from "@/components/I18nProvider";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/button";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/common/Skeleton";
import { ArrowRightIcon, CheckIcon, LightbulbIcon, LockIcon, RefreshIcon, StarIcon, XIcon } from "@/components/icons";
import { formatPercent, topicConfig, AchievementScope, type AchievementProgressResponse, type DifficultyLevel, type UserAnswerStatsByDifficulty } from "@/lib";
import type {
  ActiveDifficultyPanelProps,
  DifficultyStatsTableProps,
  ErrorStateProps,
  GlobalStatsPanelProps,
  HeroPanelProps,
  StatPairProps,
  SummaryGridProps,
  UnlockLevelCardProps,
  UnlockLevelsGridProps,
  UserStatsPanelProps
} from "./types/UserStatsPanel.types";
import { Accordion } from "./common/Accordion";

const ICON_TONES = {
  accent: "bg-accent-green/15 text-accent-green",
  mint: "bg-pastel-mint/15 text-pastel-mint",
  coral: "bg-pastel-coral/15 text-pastel-coral",
  amber: "bg-pastel-amber/15 text-pastel-amber",
  sky: "bg-pastel-sky/15 text-pastel-sky",
} as const;

type IconTone = keyof typeof ICON_TONES;

function Card({ children, className = "", ringClassName = "ring-base-600/40" }: { children: ReactNode; className?: string; ringClassName?: string }) {
  return (
    <section className={["relative w-full rounded-2xl bg-base-800/60 p-3 ring-1 ring-inset sm:p-4", ringClassName, className].join(" ")}>
      {children}
    </section>
  );
}

function CardTitle({ children, action, className = "text-ink-500" }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className={["text-xs font-medium", className].join(" ")}>{children}</p>
      {action}
    </div>
  );
}

function IconChip({ tone, children, className = "h-8 w-8" }: { tone: IconTone; children: ReactNode; className?: string }) {
  return (
    <span className={["flex shrink-0 items-center justify-center rounded-xl", ICON_TONES[tone], className].join(" ")}>
      {children}
    </span>
  );
}

function RefreshButton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={t('common_refresh')}
      title={t('common_refresh')}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-green/10 text-accent-green transition-colors hover:bg-accent-green/20 disabled:opacity-60"
    >
      <RefreshIcon className="block h-4 w-4 shrink-0" spinning={refreshing} />
    </button>
  );
}

function ProgressBar({ progress, tone }: { progress: number; tone: "accent" | "muted" }) {
  const percentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-600/70">
      <div
        className={[
          "h-full rounded-full transition-all duration-500",
          tone === "accent" ? "bg-accent-green shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent-green)_60%,transparent)]" : "bg-ink-500/60",
        ].join(" ")}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2.5" aria-busy="true">
      <Card>
        <SkeletonText className="w-24" />
        <SkeletonBlock className="mt-3 h-12 w-40" />
        <SkeletonText className="mt-3 w-3/4" />
        <SkeletonBlock className="mt-4 h-1.5 w-full rounded-full" />
      </Card>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <SkeletonBlock className="h-8 w-8 rounded-xl" />
            <SkeletonBlock className="mt-2 h-6 w-12" />
          </Card>
        ))}
      </div>
      <Card>
        <SkeletonText className="w-32" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-14 rounded-xl" />)}
        </div>
      </Card>
    </div>
  );
}

function ErrorState({ error }: ErrorStateProps) {
  return (
    <Card ringClassName="ring-pastel-coral/50">
      <p className="text-sm text-pastel-coral">{error}</p>
    </Card>
  );
}

function StatPair({ label, value }: StatPairProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] text-ink-500">{label}</p>
      <p className="text-base font-semibold tabular-nums text-ink-100">{value}</p>
    </div>
  );
}

function MetricTile({ tone, icon, label, value }: { tone: IconTone; icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-base-800/60 p-3 ring-1 ring-inset ring-base-600/40">
      <IconChip tone={tone}>{icon}</IconChip>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11px] text-ink-500">{label}</p>
        <p className="text-lg font-bold tabular-nums text-ink-100">{value}</p>
      </div>
    </div>
  );
}

function GlobalStatsPanel({ stats }: GlobalStatsPanelProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardTitle>{t('global_stats_label')}</CardTitle>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPair label={t('global_stats_insight_points')} value={stats.totalInsightPoints} />
        <StatPair label={t('global_stats_best_streak')} value={stats.bestStreakOverall} />
        <StatPair label={t('global_stats_answers')} value={stats.totalAttempts} />
        <StatPair label={t('global_stats_accuracy')} value={formatPercent(stats.accuracy)} />
      </div>

      {stats.byTopic.length > 0 ? (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.byTopic.map((topic) => (
            <div key={topic.topicId} className="flex items-center justify-between gap-2 rounded-xl bg-base-700/40 px-3 py-2 text-xs">
              <p className="truncate text-ink-300">{topic.name}</p>
              <p className="shrink-0 tabular-nums text-ink-100">
                {topic.correctAttempts}/{topic.totalAttempts} · {formatPercent(topic.accuracy)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
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
        onClick={(e) => e.stopPropagation()}
        className="group inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-green/10 text-sm transition-all duration-200 hover:scale-110 hover:bg-accent-green/20 hover:shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent-green)_45%,transparent)]"
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
        className={["rounded-xl p-2.5", unlocked ? "bg-accent-green/10 ring-1 ring-inset ring-accent-green/30" : "bg-base-700/40"].join(" ")}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-ink-100">{a.name ? `${a.name.charAt(0).toUpperCase()}${a.name.slice(1)}` : a.name}</p>
            {a.gameLink && !isCurrentGameLink(a.gameLink) ? <GameLinkButton href={a.gameLink} /> : null}
          </div>
          {unlocked ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-green">
              <CheckIcon className="h-3.5 w-3.5" />
              {t('achievements_unlocked')}
            </span>
          ) : (
            <span className="shrink-0 text-xs tabular-nums text-ink-500">{currentValue}/{threshold}</span>
          )}
        </div>

        {a.description ? <p className="mt-1 text-xs text-ink-500">{a.description}</p> : null}
        <div className="mt-2">
          <ProgressBar progress={progress} tone={unlocked ? "accent" : "muted"} />
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
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 scrollbar-hide">
                {group.achievements.map(renderAchievement)}
              </div>
            )
          }))}
        />
      )
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-base-800/60 ring-1 ring-inset ring-base-600/40">
      <Accordion items={items} className="max-h-[460px] min-h-[52px] scrollbar-hide" />
    </div>
  );
}

function HeroPanel({ stats, refreshing, onRefresh }: HeroPanelProps) {
  const { t } = useI18n();
  const nextUnlock = stats.progression.nextDifficultyToUnlock;
  const nextUnlockStatus = nextUnlock ? stats.progression.levels.find((row) => row.difficultyLevel === nextUnlock) ?? null : null;

  return (
    <Card className="bg-[radial-gradient(120%_100%_at_0%_0%,color-mix(in_srgb,var(--color-accent-green)_16%,transparent),transparent_60%)]">
      <CardTitle action={<RefreshButton refreshing={refreshing} onRefresh={onRefresh} />}>{t('stats_label')}</CardTitle>

      <div className="mt-2 flex items-center gap-3">
        <IconChip tone="amber" className="h-12 w-12 rounded-2xl shadow-[0_0_18px_color-mix(in_srgb,var(--color-pastel-amber)_30%,transparent)]">
          <StarIcon className="h-6 w-6" />
        </IconChip>
        <div className="min-w-0">
          <p className="text-3xl font-bold leading-none tabular-nums text-ink-100 sm:text-4xl">{stats.totalInsightPoints}</p>
          <p className="mt-1 text-xs font-medium text-ink-500">{t('stats_points_suffix')}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-300">
        {t('stats_summary', { answers: stats.totalAttempts, accuracy: formatPercent(stats.accuracy), streak: stats.bestStreakOverall })}
      </p>

      <div className="mt-3 border-t border-base-600/40 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-500">{t('stats_progress_next')}</p>
            <p className="mt-0.5 text-sm text-ink-300">
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
            <p className="shrink-0 text-sm font-semibold tabular-nums text-ink-100">
              {nextUnlockStatus.correctAnswersTowardsUnlock}/{nextUnlockStatus.requiredCorrectAnswers}
            </p>
          ) : null}
        </div>
        <div className="mt-2">
          <ProgressBar progress={nextUnlockStatus?.progress ?? 1} tone="accent" />
        </div>
      </div>
    </Card>
  );
}

function SummaryGrid({ stats }: SummaryGridProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2 lg:content-start">
      <MetricTile tone="mint" icon={<CheckIcon className="h-4 w-4" />} label={t('stats_correct')} value={stats.correctAttempts} />
      <MetricTile tone="coral" icon={<XIcon className="h-3.5 w-3.5" />} label={t('stats_wrong')} value={stats.wrongAttempts} />
      <MetricTile tone="amber" icon={<ArrowRightIcon className="h-4 w-4" />} label={t('stats_skips')} value={stats.skipCount} />
      <MetricTile tone="sky" icon={<LightbulbIcon className="h-4 w-4" />} label={t('stats_hints_used')} value={stats.hintsUsedCount} />
    </div>
  );
}

function ActiveDifficultyPanel({ activeLevel }: ActiveDifficultyPanelProps) {
  const { t } = useI18n();

  return (
    <Card ringClassName="ring-accent-green/30" className="bg-accent-green/5">
      <CardTitle className="text-accent-green">{t('stats_current_focus')}</CardTitle>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPair label={t('stats_level')} value={activeLevel.difficultyLevel} />
        <StatPair label={t('stats_points')} value={activeLevel.insightPoints} />
        <StatPair label={t('stats_correct')} value={activeLevel.correctAttempts} />
        <StatPair label={t('stats_wrong')} value={activeLevel.wrongAttempts} />
        <StatPair label={t('stats_accuracy')} value={formatPercent(activeLevel.accuracy)} />
        <StatPair label={t('stats_streak')} value={`${activeLevel.currentStreak} / ${t('stats_best_streak').toLowerCase()} ${activeLevel.bestStreak}`} />
      </div>
    </Card>
  );
}

function DifficultyStatsTable({ stats, activeDifficulty, onOpenDetails }: DifficultyStatsTableProps) {
  const { t } = useI18n();

  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>, difficultyLevel: DifficultyLevel) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails(difficultyLevel);
    }
  }

  return (
    <Card>
      <CardTitle>{t('stats_details_hint')}</CardTitle>
      <div className="mt-3 grid gap-1.5 md:hidden">
        {stats.byDifficulty.map((row) => {
          const active = row.difficultyLevel === activeDifficulty;
          return (
            <button
              key={row.difficultyLevel}
              type="button"
              onClick={() => onOpenDetails(row.difficultyLevel)}
              className={[
                "rounded-xl p-3 text-left text-sm transition-colors",
                active
                  ? "bg-accent-green/10 ring-1 ring-inset ring-accent-green/40"
                  : "bg-base-700/40 hover:bg-base-700/60",
              ].join(" ")}
              aria-label={t('stats_detail_open_for_level', { level: row.difficultyLevel })}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className={["font-semibold", active ? "text-accent-green" : "text-ink-100"].join(" ")}>{t('difficulty_level', { level: row.difficultyLevel })}</p>
                <span className="rounded-full bg-base-600/60 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink-100">{formatPercent(row.accuracy)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <p><span className="text-ink-500">{t('stats_points')}:</span> <span className="tabular-nums text-ink-100">{row.insightPoints}</span></p>
                <p><span className="text-ink-500">{t('stats_answers')}:</span> <span className="tabular-nums text-ink-100">{row.totalAttempts}</span></p>
                <p><span className="text-ink-500">{t('stats_correct')}:</span> <span className="tabular-nums text-pastel-mint">{row.correctAttempts}</span></p>
                <p><span className="text-ink-500">{t('stats_wrong')}:</span> <span className="tabular-nums text-pastel-coral">{row.wrongAttempts}</span></p>
                <p><span className="text-ink-500">{t('stats_skips')}:</span> <span className="tabular-nums text-ink-100">{row.skipCount}</span></p>
                <p><span className="text-ink-500">{t('stats_hints_used')}:</span> <span className="tabular-nums text-ink-100">{row.hintsUsedCount}</span></p>
                <p><span className="text-ink-500">{t('stats_best_streak')}:</span> <span className="tabular-nums text-ink-100">{row.bestStreak}</span></p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:mt-3 md:block">
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
                onKeyDown={(e) => onKeyDown(e, row.difficultyLevel)}
                role="button"
                tabIndex={0}
                aria-label={t('stats_detail_open_for_level', { level: row.difficultyLevel })}
                className={[
                  "cursor-pointer rounded-xl bg-base-700/40 text-ink-300 transition-colors hover:bg-base-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-greenDim",
                  row.difficultyLevel === activeDifficulty ? "outline outline-1 outline-accent-green/50" : "",
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
    </Card>
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
    <div className={["rounded-xl p-2.5", level.unlocked ? "bg-accent-green/10 ring-1 ring-inset ring-accent-green/30" : "bg-base-700/40"].join(" ")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-100">{t('difficulty_level', { level: level.difficultyLevel })}</p>
        {level.unlocked ? (
          <CheckIcon className="h-4 w-4 shrink-0 text-accent-green" />
        ) : (
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-ink-500" />
        )}
        <span className="sr-only">{level.unlocked ? t('stats_unlock_open') : t('stats_unlock_locked')}</span>
      </div>
      <div className="mt-2">
        <ProgressBar progress={level.progress} tone={level.unlocked ? "accent" : "muted"} />
      </div>
      <p className="mt-1.5 text-[11px] text-ink-500">
        {level.difficultyLevel === 1
          ? t('stats_starter_level')
          : t('stats_unlock_progress', { current: level.correctAnswersTowardsUnlock, required: level.requiredCorrectAnswers, previous: level.difficultyLevel - 1 })}
      </p>
    </div>
  );
}

function UnlockLevelsGrid({ stats }: UnlockLevelsGridProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardTitle>{t('difficulty_label')}</CardTitle>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {stats.progression.levels.map((level) => (
          <UnlockLevelCard key={level.difficultyLevel} level={level} />
        ))}
      </div>
    </Card>
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
    <div className="space-y-2.5">
      <div className="grid gap-2.5 lg:grid-cols-[1.2fr_0.8fr]">
        <HeroPanel stats={stats} refreshing={refreshing} onRefresh={onRefresh} />
        <SummaryGrid stats={stats} />
      </div>

      {activeLevel ? <ActiveDifficultyPanel activeLevel={activeLevel} /> : null}
      {globalStats ? <GlobalStatsPanel stats={globalStats} /> : null}
      {achievements ? <AchievementsPanel achievements={achievements} /> : null}

      <DifficultyStatsTable
        stats={stats}
        activeDifficulty={activeDifficulty}
        onOpenDetails={(difficultyLevel) => setDetailDifficulty(difficultyLevel)}
      />
      <UnlockLevelsGrid stats={stats} />
      {detailRow ? <DifficultyStatsDetailModal row={detailRow} isOpen={detailRow !== null} onClose={() => setDetailDifficulty(null)} /> : null}

      {error ? <p className="text-xs text-pastel-coral">{t('stats_refresh_warning', { error })}</p> : null}
    </div>
  );
}

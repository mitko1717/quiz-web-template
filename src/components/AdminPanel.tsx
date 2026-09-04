"use client";

import { type ReactNode, useDeferredValue, useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { BodyText, SectionLabel } from "@/components/common/SectionLabel";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/table";
import { useAdminPanel } from "@/hooks/useAdminPanel";
import { Pagination } from "@/components/common/Pagination";
import { useI18n } from "@/components/I18nProvider";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/common/Skeleton";
import type { AdminQuizConfigResponse, DifficultyLevel } from "@/lib/types";
import type {
  AdminPanelProps,
  DifficultyNumberEditorProps,
  DifficultyRow,
  MetricCardProps,
  ProbabilityEditorProps,
  QuizConfigEditorProps,
  SurfaceProps,
  UserDetailPanelProps,
  UserListPanelProps
} from "./AdminPanel.types";
import { topicConfig } from "@/lib/topic.config";
import { formatPercent } from "@/lib/utils";

const LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

function Surface({ children, title, subtitle, action }: SurfaceProps) {
  return (
    <section className="rounded-2xl border border-base-600 bg-base-800 p-3.5 sm:p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <SectionLabel>{title}</SectionLabel>
          {subtitle ? <BodyText>{subtitle}</BodyText> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function VerticalStack({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function MetricCard({ label, value, tone = "text-ink-100" }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-base-600 bg-base-700/40 p-1">
      <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{label}</p>
      <p className={["mt-1 text-lg font-semibold", tone].join(" ")}>{value}</p>
    </div>
  );
}

function UserListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-base-600 bg-base-700/35 p-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <SkeletonText className="w-40" />
              <SkeletonText className="mt-2 w-56" />
            </div>
            <div className="space-y-2 sm:w-20">
              <SkeletonText className="w-16 sm:ml-auto" />
              <SkeletonText className="w-12 sm:ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      <div className="grid gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-20 rounded-xl" />)}
      </div>
      <SkeletonText className="w-36" />
      <div className="grid gap-2 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="hidden space-y-2 md:block">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-11 rounded-xl" />)}
      </div>
    </div>
  );
}

function QuizConfigSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <SkeletonText className="w-44" />
          <SkeletonText className="mt-3 w-3/4" />
          <SkeletonBlock className="mt-3 h-11 w-full max-w-[220px] rounded-xl" />
        </div>
      ))}
      <div className="grid gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-16 rounded-xl" />)}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SkeletonBlock className="h-11 w-full rounded-xl sm:w-36" />
        <SkeletonBlock className="h-11 w-full rounded-xl sm:w-32" />
      </div>
    </div>
  );
}

function UserListPanel({ users, selectedUser, search, setSearch, loadingUsers, usersError, offset, pageSize, onSelectUser, onReload, onPageChange }: UserListPanelProps) {
  const { t } = useI18n();
  const deferredSearch = useDeferredValue(search);
  const currentPage = Math.floor(offset / pageSize);
  const totalPages = users ? Math.ceil(users.totalUsers / pageSize) : 0;
  const firstItem = users && users.totalUsers > 0 ? offset + 1 : 0;
  const lastItem = users ? Math.min(offset + pageSize, users.totalUsers) : 0;

  return (
    <Surface
      title={t("admin_users_title")}
      subtitle={users ? t("admin_users_subtitle", { first: firstItem, last: lastItem, total: users.totalUsers }) : undefined}
    >
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin_search_placeholder")}
          className="w-full text-sm sm:min-w-[200px] sm:flex-1"
        />
        <Button variant="ghost" className="w-full sm:w-auto" onClick={onReload} disabled={loadingUsers || deferredSearch !== search}>
          {t("common_refresh")}
        </Button>
      </div>
      {usersError ? <p className="mb-2 text-sm text-pastel-coral">{usersError}</p> : null}
      {loadingUsers && !users ? <UserListSkeleton /> : null}
      {!loadingUsers && users?.items.length === 0 ? <p className="text-sm text-ink-300">{t("admin_no_users")}</p> : null}
      <div className="space-y-1">
        {users?.items.map((i) => {
          const active = selectedUser?.summary.userId === i.userId;

          return (
            <Button
              key={i.userId}
              type="button"
              variant={active ? "adminRowActive" : "adminRowIdle"}
              size="md"
              onClick={() => onSelectUser(i.userId)}
              className={["w-full p-1 text-left font-normal text-sm"].join(" ")}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink-100">{i.displayName ?? i.tgDisplayName ?? i.tgUsername ?? i.email ?? i.deviceId ?? i.userId}</p>
                </div>
                <div className="text-left text-sm text-ink-300 sm:text-right">
                  <p>{i.insightPointsTotal} {t('admin_points_short')}</p>
                  <p>{formatPercent(i.accuracy)}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} loading={loadingUsers} onPageChange={onPageChange} />
    </Surface>
  );
}

function UserDetailPanel({ selectedUser, loading, error }: UserDetailPanelProps) {
  const { t } = useI18n();
  
  return (
    <Surface title={t("admin_user_details_title")} subtitle={t("admin_user_details_subtitle")}>
      {loading && !selectedUser ? <UserDetailSkeleton /> : null}
      {error ? <p className="text-sm text-pastel-coral">{error}</p> : null}
      {!loading && !selectedUser ? <p className="text-sm text-ink-300">{t("admin_select_user")}</p> : null}
      {selectedUser ? (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard
              label={t("admin_user")}
              value={
                selectedUser.summary.displayName
                ?? selectedUser.summary.tgDisplayName
                ?? selectedUser.summary.tgUsername
                ?? selectedUser.summary.email
                ?? t("admin_unnamed_user")
              }
            />
            <MetricCard label={t("stats_points")} value={selectedUser.summary.insightPointsTotal} tone="text-accent-green" />
            <MetricCard label={t("stats_accuracy")} value={formatPercent(selectedUser.summary.accuracy)} />
            <MetricCard label={t("stats_best_streak")} value={selectedUser.summary.bestStreakOverall} />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <MetricCard label={t("stats_answers")} value={selectedUser.summary.totalAttempts} />
            <MetricCard label={t("stats_correct")} value={selectedUser.summary.correctAttempts} tone="text-pastel-mint" />
            <MetricCard label={t("stats_wrong")} value={selectedUser.summary.wrongAttempts} tone="text-pastel-coral" />
            <MetricCard label={t("stats_skips")} value={selectedUser.summary.skipCount} tone="text-pastel-amber" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-100">{t("admin_by_difficulty")}</p>
            <div className="grid gap-2 md:hidden">
              {selectedUser.byDifficulty.map((row: DifficultyRow) => (
                <div key={row.difficultyLevel} className="rounded-xl border border-base-600 bg-base-700/40 p-2 text-sm text-ink-200">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-ink-100">{t("difficulty_level", { level: row.difficultyLevel })}</p>
                    <p className="text-ink-300">{formatPercent(row.accuracy)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <p>{t("stats_answers")}: {row.totalAttempts}</p>
                    <p>{t("stats_correct")}: {row.correctAttempts}</p>
                    <p>{t("stats_wrong")}: {row.wrongAttempts}</p>
                    <p>{t("stats_skips")}: {row.skipCount}</p>
                    <p>{t("stats_hints_used")}: {row.hintsUsedCount}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="edge-safe-scroll hidden overflow-x-auto md:block">
              <Table>
                <TableHead>
                  <TableRow className="text-left text-ink-500">
                    {[t("stats_level"), t("stats_answers"), t("stats_correct"), t("stats_wrong"), t("stats_skips"), t("stats_hints_used"), t("stats_accuracy")].map((h) => (
                      <TableHeaderCell key={h}>{h}</TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedUser.byDifficulty.map((row: DifficultyRow) => (
                    <TableRow key={row.difficultyLevel} className="border border-base-600 bg-base-700/40 text-ink-200">
                      <TableCell className="font-semibold text-ink-100">{row.difficultyLevel}</TableCell>
                      <TableCell>{row.totalAttempts}</TableCell>
                      <TableCell>{row.correctAttempts}</TableCell>
                      <TableCell>{row.wrongAttempts}</TableCell>
                      <TableCell>{row.skipCount}</TableCell>
                      <TableCell>{row.hintsUsedCount}</TableCell>
                      <TableCell>{formatPercent(row.accuracy)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : null}
    </Surface>
  );
}

function DifficultyNumberEditor({ label, values, min, onChange }: DifficultyNumberEditorProps) {
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-100">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LEVELS.map((lvl) => (
          <ProbabilityEditor
            key={lvl}
            label={t("difficulty_level", { level: lvl })}
            field={String(lvl)}
            value={values[lvl]}
            min={min}
            step={1}
            onChange={(f, v) => onChange(Number(f) as DifficultyLevel, v)}
          />
        ))}
      </div>
    </div>
  );
}

function ProbabilityEditor({ label, field, value, onChange, ...inputProps }: ProbabilityEditorProps) {
  return (
    <label className="grid gap-1 text-sm text-ink-300">
      <span>{label}</span>
      <Input type="number" value={value} onChange={(e) => onChange(field, Number(e.target.value))} {...inputProps} />
    </label>
  );
}

function ConfigFieldTitle({ label }: { label: string }) {
  return <p className="mb-1 text-sm font-semibold text-ink-100">{label}</p>;
}

function clampBySchema(value: number, schema: { min: number; max: number }): number {
  return Math.min(schema.max, Math.max(schema.min, value));
}

function QuizConfigEditor({ config, schema, saving, error, onSave, onReset }: QuizConfigEditorProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<AdminQuizConfigResponse>(() => JSON.parse(JSON.stringify(config)) as AdminQuizConfigResponse);

  function setAttempts(lvl: DifficultyLevel, v: number) {
    setDraft((d) => ({ ...d, maxAttemptsByDifficulty: { ...d.maxAttemptsByDifficulty, [lvl]: v } }));
  }
  function setWrongPenalty(lvl: DifficultyLevel, v: number) {
    setDraft((d) => ({ ...d, wrongPenaltyByDifficulty: { ...d.wrongPenaltyByDifficulty, [lvl]: v } }));
  }
  function setSkipPenalty(lvl: DifficultyLevel, v: number) {
    setDraft((d) => ({ ...d, skipPenaltyByDifficulty: { ...d.skipPenaltyByDifficulty, [lvl]: v } }));
  }
  function setExpertField(field: string, v: number) {
    setDraft((d) => ({ ...d, expert: { ...d.expert, [field]: v } }));
  }
  function setDailyStreakBonus(day: '7' | '30', value: number) {
    setDraft((d) => ({
      ...d,
      dailyStreakMilestoneBonuses: { ...d.dailyStreakMilestoneBonuses, [day]: Math.max(0, value) }
    }));
  }
  function setInsightReward(lvl: DifficultyLevel, v: number) {
    setDraft((d) => ({ ...d, insightPointRewardsByDifficulty: { ...d.insightPointRewardsByDifficulty, [lvl]: v } }));
  }

  return (
    <VerticalStack>
      <div>
        <ConfigFieldTitle label={t("admin_allow_reverse_mode_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_allow_reverse_mode_desc")}</p>
        <div className="grid grid-cols-2 gap-1.5 max-w-[220px]">
          <Button
            type="button"
            variant={draft.allowReverseMode ? "inputModeActive" : "inputModeIdle"}
            size="md"
            onClick={() => setDraft((d) => ({ ...d, allowReverseMode: true }))}
            className="min-h-11 rounded-lg px-2.5 py-2 text-sm"
          >
            {t("common_enabled")}
          </Button>
          <Button
            type="button"
            variant={!draft.allowReverseMode ? "inputModeActive" : "inputModeIdle"}
            size="md"
            onClick={() => setDraft((d) => ({ ...d, allowReverseMode: false }))}
            className="min-h-11 rounded-lg px-2.5 py-2 text-sm"
          >
            {t("common_disabled")}
          </Button>
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_no_repeat_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_no_repeat_desc", { max: topicConfig.maxItemCount })}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={1}
            max={topicConfig.maxItemCount}
            step={1}
            value={draft.noRepeatWindow}
            onChange={(e) => {
              const v = Math.min(topicConfig.maxItemCount, Math.max(1, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.noRepeatWindow) : v;
              setDraft((d) => ({ ...d, noRepeatWindow: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_repeat_window_fraction_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_repeat_window_fraction_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={0.1}
            max={0.95}
            step={0.01}
            value={draft.repeatWindowPoolFraction}
            onChange={(e) => {
              const v = Math.min(0.95, Math.max(0.1, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.repeatWindowPoolFraction) : v;
              setDraft((d) => ({ ...d, repeatWindowPoolFraction: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_mistake_weight_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_mistake_weight_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={draft.mistakeWeightBoostMultiplier}
            onChange={(e) => {
              const v = Math.min(10, Math.max(0, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.mistakeWeightBoostMultiplier) : v;
              setDraft((d) => ({ ...d, mistakeWeightBoostMultiplier: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_free_text_typo_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_free_text_typo_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={0}
            max={5}
            step={1}
            value={draft.freeTextMaxTypoDistance}
            onChange={(e) => {
              const v = Math.min(5, Math.max(0, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.freeTextMaxTypoDistance) : v;
              setDraft((d) => ({ ...d, freeTextMaxTypoDistance: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_free_text_attempts_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_free_text_attempts_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={1}
            max={5}
            step={1}
            value={draft.freeTextMaxAttempts}
            onChange={(e) => {
              const v = Math.min(5, Math.max(1, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.freeTextMaxAttempts) : v;
              setDraft((d) => ({ ...d, freeTextMaxAttempts: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_free_text_bonus_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_free_text_bonus_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={0}
            max={10}
            step={1}
            value={draft.freeTextBonusInsightPoints}
            onChange={(e) => {
              const v = Math.min(10, Math.max(0, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.freeTextBonusInsightPoints) : v;
              setDraft((d) => ({ ...d, freeTextBonusInsightPoints: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_daily_challenge_count_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_daily_challenge_count_desc")}</p>
        <div className="w-full max-w-[220px]">
          <Input
            type="number"
            min={1}
            max={10}
            step={1}
            value={draft.dailyChallengeQuestionCount}
            onChange={(e) => {
              const v = Math.min(10, Math.max(1, Number(e.target.value)));
              const clamped = schema ? clampBySchema(v, schema.dailyChallengeQuestionCount) : v;
              setDraft((d) => ({ ...d, dailyChallengeQuestionCount: clamped }));
            }}
          />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_unlock_title")} />
        <p className="mb-4 text-xs text-ink-500">{t("admin_unlock_desc", { max: topicConfig.maxItemCount })}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(["2", "3", "4", "5"] as const).map((lvl) => {
            const fromLvl = Number(lvl) - 1;
            const current = draft.unlockThresholds?.[lvl] ?? 5;
            
            return (
              <div key={lvl} className="rounded-xl border border-base-600 bg-base-700/40 p-2">
                <p className="mb-1 text-xs font-medium text-ink-500">
                  {t("difficulty_level", { level: fromLvl })} <span className="text-accent-green">→</span> {t("difficulty_level", { level: lvl })}
                </p>
                <p className="mb-2 text-[10px] text-ink-500">{t("admin_unlock_level_caption", { level: lvl })}</p>
                <Input
                  type="number"
                  min={1}
                  max={topicConfig.maxItemCount}
                  step={1}
                  value={current}
                  onChange={(e) => {
                    const v = Math.min(topicConfig.maxItemCount, Math.max(1, Number(e.target.value)));
                    setDraft((d) => ({ ...d, unlockThresholds: { ...(d.unlockThresholds ?? {}), [lvl]: v } }));
                  }}
                />
                <p className="mt-2 text-[10px] text-ink-400">{t("admin_unlock_correct_caption", { value: current, level: fromLvl })}</p>
              </div>
            );
          })}
        </div>
      </div>

      <DifficultyNumberEditor label={t("admin_attempts_title")} values={draft.maxAttemptsByDifficulty} min={1} onChange={setAttempts} />
      <DifficultyNumberEditor label={t("admin_insight_rewards_title")} values={draft.insightPointRewardsByDifficulty} min={0} onChange={setInsightReward} />
      <DifficultyNumberEditor label={t("admin_wrong_penalty_title")} values={draft.wrongPenaltyByDifficulty} min={0} onChange={setWrongPenalty} />
      <DifficultyNumberEditor label={t("admin_skip_penalty_title")} values={draft.skipPenaltyByDifficulty} min={0} onChange={setSkipPenalty} />

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-100">{t("admin_expert_title")}</p>
        <div className="grid gap-2 md:grid-cols-2">
          <ProbabilityEditor label={t("admin_expert_none")} field="expertNoneOfAboveProbability" value={draft.expert.expertNoneOfAboveProbability} onChange={setExpertField} />
          <ProbabilityEditor label={t("admin_expert_trap")} field="expertTrapHistoryProbability" value={draft.expert.expertTrapHistoryProbability} onChange={setExpertField} />
          <ProbabilityEditor label={t("admin_expert_same_item")} field="expertSameItemAllOptionsProbability" value={draft.expert.expertSameItemAllOptionsProbability} onChange={setExpertField} />
        </div>
      </div>

      <div>
        <ConfigFieldTitle label={t("admin_daily_streak_title")} />
        <p className="mb-2 text-xs text-ink-500">{t("admin_daily_streak_desc")}</p>
        <div className="grid gap-2 md:grid-cols-2">
          {([
            { day: '7', label: t("admin_daily_streak_day7") },
            { day: '30', label: t("admin_daily_streak_day30") },
          ] as const).map(({ day, label }) => (
            <label key={day} className="grid gap-1 text-sm text-ink-300">
              <span>{label}</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={draft.dailyStreakMilestoneBonuses[day] ?? 0}
                onChange={(e) => setDailyStreakBonus(day, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-pastel-coral">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={() =>
            onSave({
              allowReverseMode: draft.allowReverseMode,
              noRepeatWindow: draft.noRepeatWindow,
              repeatWindowPoolFraction: draft.repeatWindowPoolFraction,
              mistakeWeightBoostMultiplier: draft.mistakeWeightBoostMultiplier,
              freeTextMaxTypoDistance: draft.freeTextMaxTypoDistance,
              freeTextMaxAttempts: draft.freeTextMaxAttempts,
              freeTextBonusInsightPoints: draft.freeTextBonusInsightPoints,
              dailyChallengeQuestionCount: draft.dailyChallengeQuestionCount,
              unlockThresholds: draft.unlockThresholds,
              maxAttemptsByDifficulty: draft.maxAttemptsByDifficulty,
              wrongPenaltyByDifficulty: draft.wrongPenaltyByDifficulty,
              skipPenaltyByDifficulty: draft.skipPenaltyByDifficulty,
              dailyStreakMilestoneBonuses: draft.dailyStreakMilestoneBonuses,
              insightPointRewardsByDifficulty: draft.insightPointRewardsByDifficulty,
              expert: draft.expert,
            })
          }
        >
          {saving ? t("common_saving") : t("common_save_changes")}
        </Button>
        <Button variant="ghost" className="w-full sm:w-auto" disabled={saving} onClick={onReset}>
          {t("admin_reset_defaults")}
        </Button>
      </div>
    </VerticalStack>
  );
}

export function AdminPanel({ token, authMode, canAccess, pageSize = 5 }: AdminPanelProps) {
  const { t } = useI18n();
  const hasAdminAccess = canAccess ?? authMode === "localAdmin";

  const {
    users,
    selectedUser,
    gameplayConfig,
    gameplayConfigSchema,
    search,
    setSearch,
    offset,
    pageSize: hookPageSize,
    goToPage,
    loadingUsers,
    loadingSelectedUser,
    loadingGameplayConfig,
    usersError,
    selectedUserError,
    isOffline,
    savingConfig,
    saveConfigError,
    reloadUsers,
    selectUser,
    updateGameplayConfig,
    resetGameplayConfig,
  } = useAdminPanel(token, hasAdminAccess, pageSize);

  if (!hasAdminAccess) return null;

  const showOfflineFallback = isOffline && ((loadingUsers && !users) || (loadingSelectedUser && !selectedUser) || (loadingGameplayConfig && !gameplayConfig));

  return (
    <VerticalStack>
      {showOfflineFallback ? <OfflineStateHint /> : null}
      <div className="grid gap-2 2xl:grid-cols-[1fr_1.4fr]">
        <UserListPanel
          users={users}
          selectedUser={selectedUser}
          search={search}
          setSearch={setSearch}
          loadingUsers={loadingUsers}
          usersError={usersError}
          offset={offset}
          pageSize={hookPageSize}
          onSelectUser={selectUser}
          onReload={reloadUsers}
          onPageChange={goToPage}
        />
        <UserDetailPanel selectedUser={selectedUser} loading={loadingSelectedUser} error={selectedUserError} />
      </div>

      <Surface title={t("admin_config_title")}>
        {loadingGameplayConfig && !gameplayConfig ? <QuizConfigSkeleton /> : null}
        {gameplayConfig ? (
          <QuizConfigEditor
            key={JSON.stringify(gameplayConfig)}
            config={gameplayConfig}
            schema={gameplayConfigSchema}
            saving={savingConfig}
            error={saveConfigError}
            onSave={(patch) => void updateGameplayConfig(patch)}
            onReset={() => void resetGameplayConfig()}
          />
        ) : null}
      </Surface>
    </VerticalStack>
  );
}

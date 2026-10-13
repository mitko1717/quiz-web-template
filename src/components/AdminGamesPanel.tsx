"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/common/input";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { useI18n } from "@/components/I18nProvider";
import { useAdminGames } from "@/hooks";
import type { AdminGame, CreateGamePayload, LocalizedText } from "@/lib";

type LocalizedDraft = { en: string; es: string; uk: string };

type Draft = {
  slug: string;
  name: LocalizedDraft;
  description: LocalizedDraft;
  tgBotLink: string;
  logo: string;
  bannerImage: string;
  tagline: LocalizedDraft;
  active: boolean;
  sortOrder: number;
};

const EMPTY_LOCALIZED: LocalizedDraft = { en: "", es: "", uk: "" };

const EMPTY_DRAFT: Draft = {
  slug: "", name: { ...EMPTY_LOCALIZED }, description: { ...EMPTY_LOCALIZED }, tgBotLink: "", logo: "", bannerImage: "",
  tagline: { ...EMPTY_LOCALIZED }, active: true, sortOrder: 0
};

function toLocalizedDraft(value: LocalizedText | null | undefined): LocalizedDraft {
  return { en: value?.en ?? "", es: value?.es ?? "", uk: value?.uk ?? "" };
}

function toDraft(g: AdminGame): Draft {
  return {
    slug: g.slug,
    name: toLocalizedDraft(g.name),
    description: toLocalizedDraft(g.description),
    tgBotLink: g.tgBotLink ?? "",
    logo: g.logo ?? "",
    bannerImage: g.bannerImage ?? "",
    tagline: toLocalizedDraft(g.tagline),
    active: g.active,
    sortOrder: g.sortOrder,
  };
}

function localizedDraftToPayload(d: LocalizedDraft): LocalizedText | undefined {
  const en = d.en.trim();
  if (!en) return undefined;
  const payload: LocalizedText = { en };
  if (d.es.trim()) payload.es = d.es.trim();
  if (d.uk.trim()) payload.uk = d.uk.trim();
  return payload;
}

function draftToPayload(d: Draft): CreateGamePayload {
  const name = localizedDraftToPayload(d.name);
  return {
    slug: d.slug.trim(),
    name: name ?? { en: "" },
    description: localizedDraftToPayload(d.description),
    tgBotLink: d.tgBotLink.trim() || undefined,
    logo: d.logo.trim() || undefined,
    bannerImage: d.bannerImage.trim() || undefined,
    tagline: localizedDraftToPayload(d.tagline),
    active: d.active,
    sortOrder: Number(d.sortOrder) || 0,
  };
}

function LocalizedFieldGroup({ label, value, onChange }: {
  label: string;
  value: LocalizedDraft;
  onChange: (next: LocalizedDraft) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        <Input placeholder="EN" value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        <Input placeholder="ES" value={value.es} onChange={(e) => onChange({ ...value, es: e.target.value })} />
        <Input placeholder="UK" value={value.uk} onChange={(e) => onChange({ ...value, uk: e.target.value })} />
      </div>
    </div>
  );
}

export function AdminGamesPanel({ token, enabled }: { token: string; enabled: boolean }) {
  const { t } = useI18n();
  const { games, loadingGames, gamesError, savingGame, deletingGame, createGame, updateGame, removeGame } = useAdminGames(token, enabled);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const isEditing = editingSlug !== null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const startEdit = (g: AdminGame) => {
    setDraft(toDraft(g));
    setEditingSlug(g.slug);
  };

  const cancel = () => {
    setDraft(EMPTY_DRAFT);
    setEditingSlug(null);
  };

  const submit = async () => {
    if (!draft.slug.trim() || !draft.name.en.trim()) return;
    if (isEditing) {
      const { slug, ...rest } = draftToPayload(draft);
      await updateGame(editingSlug!, rest);
    } else {
      await createGame(draftToPayload(draft));
    }
    cancel();
  };

  return (
    <section className="rounded-2xl bg-base-700/25 p-3 ring-1 ring-inset ring-base-600/40">
      <div className="mb-2.5">
        <p className="text-sm font-semibold text-ink-100">{t("admin_games_title")}</p>
        <p className="mt-0.5 text-xs text-ink-500">{t("admin_games_desc")}</p>
      </div>

      {gamesError ? <p className="mb-2 text-sm text-pastel-coral">{gamesError}</p> : null}

      <div className="mb-3">
        {loadingGames ? (
          <p className="text-sm text-ink-500">{t("common_loading")}</p>
        ) : games.length === 0 ? (
          <p className="text-sm text-ink-500">{t("admin_games_empty")}</p>
        ) : (
          <ul className="space-y-1">
            {games.map((g) => (
              <li
                key={g.slug}
                className={[
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2",
                  editingSlug === g.slug ? "bg-accent-green/10 ring-1 ring-inset ring-accent-green/40" : "bg-base-700/30",
                ].join(" ")}
              >
                <span
                  aria-label={g.active ? t("admin_games_col_active") : undefined}
                  className={["h-2 w-2 shrink-0 rounded-full", g.active ? "bg-pastel-mint shadow-[0_0_6px_var(--color-pastel-mint)]" : "bg-ink-500/50"].join(" ")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-100">{g.name.en}</p>
                  <p className="truncate text-[11px] text-ink-500">{g.slug} · #{g.sortOrder}</p>
                </div>
                <button
                  type="button"
                  aria-label={t("admin_games_edit")}
                  title={t("admin_games_edit")}
                  onClick={() => startEdit(g)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green transition-colors hover:bg-accent-green/20"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t("admin_games_delete")}
                  title={t("admin_games_delete")}
                  disabled={deletingGame}
                  onClick={() => void removeGame(g.slug)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pastel-coral/10 text-pastel-coral transition-colors hover:bg-pastel-coral/20 disabled:opacity-40"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2.5 border-t border-base-600/40 pt-3">
        <Input placeholder={t("admin_games_field_slug")} value={draft.slug} disabled={isEditing} onChange={(e) => set("slug", e.target.value)} />
        <LocalizedFieldGroup label={t("admin_games_field_name")} value={draft.name} onChange={(v) => set("name", v)} />
        <LocalizedFieldGroup label={t("admin_games_field_tagline")} value={draft.tagline} onChange={(v) => set("tagline", v)} />
        <LocalizedFieldGroup label={t("admin_games_field_description")} value={draft.description} onChange={(v) => set("description", v)} />
        <div className="grid gap-1.5 sm:grid-cols-2">
          <Input placeholder={t("admin_games_field_bot_link")} value={draft.tgBotLink} onChange={(e) => set("tgBotLink", e.target.value)} />
          <Input placeholder={t("admin_games_field_logo")} value={draft.logo} onChange={(e) => set("logo", e.target.value)} />
          <Input placeholder={t("admin_games_field_banner")} value={draft.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} />
          <Input placeholder={t("admin_games_field_sort")} type="number" value={String(draft.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input type="checkbox" className="h-4 w-4 accent-accent-green" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
          {t("admin_games_field_active")}
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="primary"
            className={isEditing ? "w-full" : "col-span-2 w-full"}
            disabled={savingGame || !draft.slug.trim() || !draft.name.en.trim()}
            onClick={() => void submit()}
          >
            {isEditing ? t("admin_games_update") : t("admin_games_create")}
          </Button>
          {isEditing ? <Button type="button" variant="ghost" className="w-full" onClick={cancel}>{t("common_dismiss")}</Button> : null}
        </div>
      </div>
    </section>
  );
}

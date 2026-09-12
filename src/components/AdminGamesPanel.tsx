"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/common/input";
import { SectionLabel, BodyText } from "@/components/common/SectionLabel";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/common/table";
import { useI18n } from "@/components/I18nProvider";
import { useAdminGames } from "@/hooks/useAdminGames";
import type { AdminGame, CreateGamePayload, LocalizedText } from "@/lib/types";

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
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-500">{label}</p>
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
    <section className="rounded-2xl border border-base-600 bg-base-800 p-3.5 sm:p-4">
      <div className="mb-3">
        <SectionLabel>{t("admin_games_title")}</SectionLabel>
        <BodyText>{t("admin_games_desc")}</BodyText>
      </div>

      {gamesError ? <p className="mb-2 text-sm text-pastel-coral">{gamesError}</p> : null}

      <div className="space-y-3">
        <Input placeholder={t("admin_games_field_slug")} value={draft.slug} disabled={isEditing} onChange={(e) => set("slug", e.target.value)} />
        <LocalizedFieldGroup label={t("admin_games_field_name")} value={draft.name} onChange={(v) => set("name", v)} />
        <LocalizedFieldGroup label={t("admin_games_field_tagline")} value={draft.tagline} onChange={(v) => set("tagline", v)} />
        <LocalizedFieldGroup label={t("admin_games_field_description")} value={draft.description} onChange={(v) => set("description", v)} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder={t("admin_games_field_bot_link")} value={draft.tgBotLink} onChange={(e) => set("tgBotLink", e.target.value)} />
          <Input placeholder={t("admin_games_field_logo")} value={draft.logo} onChange={(e) => set("logo", e.target.value)} />
          <Input placeholder={t("admin_games_field_banner")} value={draft.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} />
          <Input placeholder={t("admin_games_field_sort")} type="number" value={String(draft.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        </div>
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm text-ink-200">
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
        {t("admin_games_field_active")}
      </label>

      <div className="mt-3 flex gap-2">
        <Button type="button" variant="primary" disabled={savingGame || !draft.slug.trim() || !draft.name.en.trim()} onClick={() => void submit()}>
          {isEditing ? t("admin_games_update") : t("admin_games_create")}
        </Button>
        {isEditing ? <Button type="button" variant="ghost" onClick={cancel}>{t("common_dismiss")}</Button> : null}
      </div>

      <div className="mt-4">
        {loadingGames ? (
          <p className="text-sm text-ink-400">{t("common_loading")}</p>
        ) : games.length === 0 ? (
          <p className="text-sm text-ink-400">{t("admin_games_empty")}</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("admin_games_col_name")}</TableHeaderCell>
                <TableHeaderCell>{t("admin_games_col_slug")}</TableHeaderCell>
                <TableHeaderCell>{t("admin_games_col_active")}</TableHeaderCell>
                <TableHeaderCell>{t("admin_games_col_actions")}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((g) => (
                <TableRow key={g.slug}>
                  <TableCell>{g.name.en}</TableCell>
                  <TableCell>{g.slug}</TableCell>
                  <TableCell>{g.active ? "✓" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(g)}>{t("admin_games_edit")}</Button>
                      <Button type="button" variant="ghost" size="sm" disabled={deletingGame} onClick={() => void removeGame(g.slug)}>{t("admin_games_delete")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

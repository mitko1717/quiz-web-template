"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { SectionLabel, BodyText } from "@/components/common/SectionLabel";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/table";
import { useI18n } from "@/components/I18nProvider";
import { useAdminGames } from "@/hooks/useAdminGames";
import type { AdminGame, CreateGamePayload } from "@/lib/types";

type Draft = {
  slug: string;
  name: string;
  description: string;
  tgBotLink: string;
  logo: string;
  bannerImage: string;
  tagline: string;
  active: boolean;
  sortOrder: number;
};

const EMPTY_DRAFT: Draft = {
  slug: "", name: "", description: "", tgBotLink: "", logo: "", bannerImage: "", tagline: "", active: true, sortOrder: 0
};

function toDraft(g: AdminGame): Draft {
  return {
    slug: g.slug,
    name: g.name,
    description: g.description ?? "",
    tgBotLink: g.tgBotLink ?? "",
    logo: g.logo ?? "",
    bannerImage: g.bannerImage ?? "",
    tagline: g.tagline ?? "",
    active: g.active,
    sortOrder: g.sortOrder,
  };
}

function draftToPayload(d: Draft): CreateGamePayload {
  return {
    slug: d.slug.trim(),
    name: d.name.trim(),
    description: d.description.trim() || undefined,
    tgBotLink: d.tgBotLink.trim() || undefined,
    logo: d.logo.trim() || undefined,
    bannerImage: d.bannerImage.trim() || undefined,
    tagline: d.tagline.trim() || undefined,
    active: d.active,
    sortOrder: Number(d.sortOrder) || 0,
  };
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
    if (!draft.slug.trim() || !draft.name.trim()) return;
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

      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder={t("admin_games_field_slug")} value={draft.slug} disabled={isEditing} onChange={(e) => set("slug", e.target.value)} />
        <Input placeholder={t("admin_games_field_name")} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        <Input placeholder={t("admin_games_field_tagline")} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
        <Input placeholder={t("admin_games_field_bot_link")} value={draft.tgBotLink} onChange={(e) => set("tgBotLink", e.target.value)} />
        <Input placeholder={t("admin_games_field_logo")} value={draft.logo} onChange={(e) => set("logo", e.target.value)} />
        <Input placeholder={t("admin_games_field_banner")} value={draft.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} />
        <Input placeholder={t("admin_games_field_description")} value={draft.description} onChange={(e) => set("description", e.target.value)} />
        <Input placeholder={t("admin_games_field_sort")} type="number" value={String(draft.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} />
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm text-ink-200">
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
        {t("admin_games_field_active")}
      </label>

      <div className="mt-3 flex gap-2">
        <Button type="button" variant="primary" disabled={savingGame || !draft.slug.trim() || !draft.name.trim()} onClick={() => void submit()}>
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
                  <TableCell>{g.name}</TableCell>
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

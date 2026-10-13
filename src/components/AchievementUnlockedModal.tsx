"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
import { ShareIcon, TrophyIcon } from "@/components/icons";
import { useI18n } from "@/components/I18nProvider";
import { useProfileQuery, useReferralLink } from "@/hooks";
import { useAuthContext } from "@/components/AuthGate";
import { topicConfig, shareViaTelegram, type UnlockedAchievement } from "@/lib";

interface AchievementUnlockedModalProps {
  achievement: UnlockedAchievement | null;
  onClose: () => void;
}

export function AchievementUnlockedModal({ achievement, onClose }: AchievementUnlockedModalProps) {
  const { t } = useI18n();
  const { token } = useAuthContext();
  const profileQuery = useProfileQuery(token);
  const referralLink = useReferralLink(profileQuery.data);

  const handleShare = async () => {
    if (!achievement || !referralLink) return;
    const text = t('share_hook_achievement', { achievement: achievement.name, appName: topicConfig.appName, link: referralLink });
    await shareViaTelegram(text);
  };

  return (
    <Modal
      isOpen={achievement !== null}
      onClose={onClose}
      closeLabel={t('achievement_unlocked_close')}
      title={t('achievement_unlocked_title')}
      maxWidthClassName="max-w-sm"
      centered
      footer={(
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            {t('achievement_unlocked_close')}
          </Button>
          <Button type="button" variant="primary" className="flex w-full items-center justify-center gap-2" onClick={() => void handleShare()} disabled={!referralLink}>
            <ShareIcon className="h-4 w-4" />
            {t('share_button')}
          </Button>
        </div>
      )}
    >
      {achievement ? (
        <div className="flex flex-col items-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pastel-amber/15 text-pastel-amber shadow-[0_0_28px_color-mix(in_srgb,var(--color-pastel-amber)_35%,transparent)]">
            <TrophyIcon className="h-8 w-8" />
          </span>
          <p className="mt-3 text-base font-semibold text-ink-100">{achievement.name}</p>
        </div>
      ) : null}
    </Modal>
  );
}

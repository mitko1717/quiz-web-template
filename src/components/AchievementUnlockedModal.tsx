"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
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
      footer={(
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('achievement_unlocked_close')}
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleShare()} disabled={!referralLink}>
            {t('share_button')}
          </Button>
        </div>
      )}
    >
      {achievement ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent-greenDim/40 bg-accent-green/10 p-3">
          <span className="text-2xl" aria-hidden="true">🏆</span>
          <p className="text-base font-semibold text-ink-100">{achievement.name}</p>
        </div>
      ) : null}
    </Modal>
  );
}
"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/Modal";
import { useI18n } from "@/components/I18nProvider";
import type { UnlockedAchievement } from "@/lib/types";

interface AchievementUnlockedModalProps {
  achievement: UnlockedAchievement | null;
  onClose: () => void;
}

export function AchievementUnlockedModal({ achievement, onClose }: AchievementUnlockedModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={achievement !== null}
      onClose={onClose}
      closeLabel={t('achievement_unlocked_close')}
      title={t('achievement_unlocked_title')}
      maxWidthClassName="max-w-sm"
      footer={(
        <div className="flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>
            {t('achievement_unlocked_close')}
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
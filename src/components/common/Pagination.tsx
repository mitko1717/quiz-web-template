import { useI18n } from "@/components/I18nProvider";
import { ChevronRightIcon } from "@/components/icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const NAV_BUTTON = "flex h-9 w-9 items-center justify-center rounded-xl bg-base-700/50 text-ink-300 transition-colors hover:text-ink-100 disabled:opacity-40";

export function Pagination({ currentPage, totalPages, loading = false, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label={t('pagination_prev')}
        title={t('pagination_prev')}
        className={NAV_BUTTON}
        disabled={currentPage === 0 || loading}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
      </button>
      <p className="text-xs tabular-nums text-ink-500">{t('pagination_page_of', { page: currentPage + 1, total: totalPages })}</p>
      <button
        type="button"
        aria-label={t('pagination_next')}
        title={t('pagination_next')}
        className={NAV_BUTTON}
        disabled={currentPage >= totalPages - 1 || loading}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

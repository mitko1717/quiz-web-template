import { Button } from "@/components/button";
import { useI18n } from "@/providers/I18nProvider";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, loading = false, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-center text-xs text-ink-500">{t('pagination_page_of', { page: currentPage + 1, total: totalPages })}</p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <Button
          variant="ghost"
          size="md"
          className="w-full sm:w-auto"
          disabled={currentPage === 0 || loading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &larr; {t('pagination_prev')}
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="w-full sm:w-auto"
          disabled={currentPage >= totalPages - 1 || loading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('pagination_next')} &rarr;
        </Button>
      </div>
    </div>
  );
}

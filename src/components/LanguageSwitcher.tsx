"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/providers/I18nProvider';
import { type Language } from '@/lib/i18n';
import { LANGUAGE_FLAGS } from '@/lib/constants/language-flags';
import { GlobeIcon } from '@/components/icons/GlobeIcon';

interface LanguageSwitcherProps {
  onChange?: (language: Language) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
  trigger?: 'inline' | 'icon';
}

const ICON_POPOVER_WIDTH_PX = 192;

export function LanguageSwitcher({ onChange, disabled = false, compact = false, trigger = 'inline' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!popoverRef.current || !rootRef.current) return;
      const target = event.target as Node;
      if (!popoverRef.current.contains(target) && !rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const updatePopoverPosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const left = Math.min(
        Math.max(8, rect.right - ICON_POPOVER_WIDTH_PX),
        window.innerWidth - ICON_POPOVER_WIDTH_PX - 8,
      );
      setPopoverStyle({
        top: rect.bottom + 8,
        left,
      });
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    updatePopoverPosition();

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen]);

  const handleChange = async (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    if (!onChange) return;

    try {
      await onChange(nextLanguage);
    } catch {
      // The caller handles reverting language and reporting errors.
    }
  };

  const languageOptions: Array<{ code: Language; short: string; label: string }> = [
    { code: 'en', short: 'EN', label: t('lang_en') },
    { code: 'es', short: 'ES', label: t('lang_es') },
    { code: 'uk', short: 'UK', label: t('lang_uk') },
  ];

  const selectControl = (
    <select
      value={language}
      onChange={(event) => {
        void handleChange(event.target.value as Language);
        setIsOpen(false);
      }}
      disabled={disabled}
      className={[
        'w-full min-w-0 rounded-lg border border-base-600 bg-base-700/60 text-ink-200 focus:border-accent-green focus:outline-none',
        compact ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-base'
      ].join(' ')}
    >
      {languageOptions.map((option) => (
        <option key={option.code} value={option.code}>
          {LANGUAGE_FLAGS[option.code]} {option.short} - {option.label}
        </option>
      ))}
    </select>
  );

  if (trigger === 'icon') {
    return (
      <div ref={rootRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-label={t('lang_label')}
          title={t('lang_label')}
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-base-600 bg-base-700/45 text-ink-200 transition-colors hover:border-accent-greenDim hover:text-ink-100 [&::-webkit-details-marker]:hidden"
        >
          <GlobeIcon className="h-4 w-4" />
        </button>
        {isOpen && popoverStyle
          ? createPortal(
              <div
                ref={popoverRef}
                className="fixed z-[1000] w-48 rounded-xl border border-base-600 bg-base-800 p-2 shadow-lg"
                style={{ top: popoverStyle.top, left: popoverStyle.left }}
              >
                <label className="grid gap-1 text-xs text-ink-400">
                  <span>{t('lang_label')}</span>
                  {selectControl}
                </label>
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  }

  return (
    <label className="inline-flex items-center gap-2.5 text-sm text-ink-400">
      <span className="sr-only">{t('lang_label')}</span>
      <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center text-ink-300">
        <GlobeIcon />
      </span>
      {selectControl}
    </label>
  );
}

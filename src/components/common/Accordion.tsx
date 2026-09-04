"use client";

import { useId, useState, type ReactNode } from "react";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultActiveId?: string;
  className?: string;
  contentClassName?: string;
}

export function Accordion({ items, defaultActiveId, className = "", contentClassName = "" }: AccordionProps) {
  const generatedId = useId();

  const [activeId, setActiveId] = useState(defaultActiveId ?? items[0]?.id ?? "",);
  if (!items.length) return null;

  return (
    <div className={["flex h-[100dvh] flex-col overflow-hidden", "md:h-[420px]", className].join(" ")}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const triggerId = `${generatedId}-${item.id}-trigger`;
        const panelId = `${generatedId}-${item.id}-panel`;

        return (
          <div
            key={item.id}
            className={[
              "flex min-h-0 flex-col overflow-hidden",
              "border-b border-base-600 last:border-b-0",
              "transition-[flex-grow] duration-500 ease-in-out",
              isActive ? "flex-1" : "flex-none",
            ].join(" ")}
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isActive}
              aria-controls={panelId}
              onClick={() => {
                if (!isActive) setActiveId(item.id);
              }}
              className={[
                "flex w-full shrink-0 items-center justify-between gap-4",
                "px-4 py-4 text-left",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-greenDim",
                isActive
                  ? "bg-base-700/60 text-ink-100"
                  : "bg-base-800 text-ink-400 hover:bg-base-700/40 hover:text-ink-200",
              ].join(" ")}
            >
              <span className="min-w-0 truncate whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em]">
                {item.title}
              </span>

              <span aria-hidden="true" className={["text-lg leading-none transition-transform duration-300", isActive ? "rotate-45 text-accent-green" : "rotate-0"].join(" ")}>
                +
              </span>
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              inert={!isActive ? true : undefined}
              className={[
                "grid min-h-0 transition-[grid-template-rows,opacity] duration-500 ease-in-out",
                isActive
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="min-h-0 overflow-hidden">
                <div className={["h-full overflow-y-auto p-4", contentClassName].join(" ")}>
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
"use client";

import { useEffect, useRef, type ReactNode } from "react";

type CardSectionProps = {
  children: ReactNode;
  className?: string;
  transitionKey?: string | number;
  resultState?: 'correct' | 'wrong' | null;
};

const BASE_CLASS_NAME = "relative w-full min-w-0 max-w-full overflow-visible rounded-2xl border bg-base-800 p-2 sm:p-4";
const TRANSITION_CLASS_NAME = "transition-all duration-300 ease-out";
const FALLBACK_FROM_CLASS_NAME = "opacity-0 translate-y-3 scale-[0.985]";
const FALLBACK_TO_CLASS_NAME = "opacity-100 translate-y-0 scale-100";

export function CardSection({ children, className, transitionKey, resultState = null }: CardSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const resultClassName =
    resultState === 'correct'
      ? 'border-pastel-mint/80 question-result-correct'
      : resultState === 'wrong'
        ? 'border-pastel-coral/80 question-result-wrong question-result-shake'
        : 'border-base-600';

  useEffect(() => {
    if (typeof transitionKey === "undefined") return;
    const node = sectionRef.current;
    if (!node) return;

    if (typeof node.animate === "function") {
      const animation = node.animate(
        [
          { opacity: 0.55, transform: "translateY(14px) scale(0.985)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        {
          duration: 420,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );

      return () => animation.cancel();
    }

    node.classList.remove(...FALLBACK_TO_CLASS_NAME.split(" "));
    node.classList.add(...FALLBACK_FROM_CLASS_NAME.split(" "));
    void node.offsetWidth;
    node.classList.remove(...FALLBACK_FROM_CLASS_NAME.split(" "));
    node.classList.add(...FALLBACK_TO_CLASS_NAME.split(" "));

    return () => {
      node.classList.remove(...FALLBACK_FROM_CLASS_NAME.split(" "));
      node.classList.remove(...FALLBACK_TO_CLASS_NAME.split(" "));
    };
  }, [transitionKey]);

  const mergedClassName = className
    ? `${BASE_CLASS_NAME} ${resultClassName} ${TRANSITION_CLASS_NAME} ${FALLBACK_TO_CLASS_NAME} ${className}`
    : `${BASE_CLASS_NAME} ${resultClassName} ${TRANSITION_CLASS_NAME} ${FALLBACK_TO_CLASS_NAME}`;

  return (
    <section ref={sectionRef} className={mergedClassName}>
      {children}
    </section>
  );
}
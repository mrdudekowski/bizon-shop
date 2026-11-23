"use client";

import { useEffect, useState } from "react";

type QuantityInputProps = {
  value: number;
  min?: number;
  max?: number;
  onValueChange: (value: number) => void;
  className?: string;
  ariaLabel: string;
  name?: string;
};

function normalizeQuantity(raw: string, min: number, max: number): number {
  const parsed = /^\d+$/.test(raw) ? Number(raw) : min;
  return Math.min(max, Math.max(min, Number.isSafeInteger(parsed) ? parsed : max));
}

export function QuantityInput({
  value,
  min = 1,
  max = 99999,
  onValueChange,
  className,
  ariaLabel,
  name,
}: QuantityInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      className={className}
      type="number"
      min={min}
      max={max}
      step={1}
      inputMode="numeric"
      aria-label={ariaLabel}
      name={name}
      value={draft}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        if (
          /^\d+$/.test(raw) &&
          Number.isSafeInteger(Number(raw)) &&
          Number(raw) >= min &&
          Number(raw) <= max
        ) {
          onValueChange(Number(raw));
        }
      }}
      onBlur={() => {
        const normalized = normalizeQuantity(draft, min, max);
        setDraft(String(normalized));
        onValueChange(normalized);
      }}
    />
  );
}

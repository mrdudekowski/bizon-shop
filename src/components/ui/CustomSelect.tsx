"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

import styles from "./CustomSelect.module.css";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  options: readonly CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

type PopoverPosition = { top: number; left: number; width: number; maxHeight: number };

function moveToEnabledOption(options: readonly CustomSelectOption[], from: number, delta: number) {
  if (options.length === 0) return -1;
  let next = from;
  for (let count = 0; count < options.length; count += 1) {
    next = (next + delta + options.length) % options.length;
    if (!options[next].disabled) return next;
  }
  return -1;
}

export function CustomSelect({
  options,
  value,
  defaultValue = "",
  onValueChange,
  name,
  required = false,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  function selectValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function showList(startAtSelected = true) {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue && !option.disabled);
    setActiveIndex(startAtSelected && selectedIndex >= 0
      ? selectedIndex
      : moveToEnabledOption(options, -1, 1));
    setOpen(true);
  }

  function updatePopoverPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportMargin = 12;
    const maxHeight = Math.min(320, Math.max(160, window.innerHeight - viewportMargin * 2));
    const estimatedHeight = Math.min(maxHeight, Math.max(48, options.length * 42 + 12));
    const below = window.innerHeight - rect.bottom - viewportMargin;
    const above = rect.top - viewportMargin;
    const openBelow = below >= Math.min(estimatedHeight, 180) || below >= above;
    const top = openBelow
      ? Math.min(rect.bottom + 6, window.innerHeight - estimatedHeight - viewportMargin)
      : Math.max(viewportMargin, rect.top - estimatedHeight - 6);
    setPosition({
      top,
      left: Math.max(viewportMargin, Math.min(rect.left, window.innerWidth - rect.width - viewportMargin)),
      width: Math.min(rect.width, window.innerWidth - viewportMargin * 2),
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target) && !listboxRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${listboxId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId, open]);

  useEffect(() => () => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      if (!open) {
        showList(event.key === "ArrowDown");
      } else {
        setActiveIndex((current) => moveToEnabledOption(options, current, delta));
      }
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      if (!open) return;
      event.preventDefault();
      const start = event.key === "Home" ? -1 : 0;
      setActiveIndex(moveToEnabledOption(options, start, event.key === "Home" ? 1 : -1));
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "Tab" && open) {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        showList();
      } else if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
        selectValue(options[activeIndex].value);
      }
      return;
    }

    if (open && event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase();
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ""; }, 700);
      const start = activeIndex < 0 ? 0 : activeIndex;
      for (let offset = 1; offset <= options.length; offset += 1) {
        const index = (start + offset) % options.length;
        if (!options[index].disabled && options[index].label.toLocaleLowerCase().startsWith(typeaheadRef.current)) {
          setActiveIndex(index);
          break;
        }
      }
    }
  }

  return (
    <span className={styles.root} ref={rootRef}>
        <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        data-custom-select-trigger=""
        className={[styles.trigger, className].filter(Boolean).join(" ")}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : showList()}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.value}>{selectedOption?.label ?? "Выберите значение"}</span>
        <ChevronDown aria-hidden="true" className={styles.chevron} />
      </button>

      {name ? (
        <select className={styles.formValue} name={name} value={selectedValue} tabIndex={-1} aria-hidden="true" onChange={() => {}}>
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
      ) : null}

      {open && position ? createPortal(
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className={styles.listbox}
          style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          onPointerDown={(event) => event.preventDefault()}
        >
          {options.map((option, index) => (
            <div
              id={`${listboxId}-option-${index}`}
              key={option.value}
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled || undefined}
              data-active={index === activeIndex || undefined}
              data-selected={option.value === selectedValue || undefined}
              className={styles.option}
              onPointerMove={() => !option.disabled && setActiveIndex(index)}
              onClick={() => !option.disabled && selectValue(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>,
        document.body,
      ) : null}
    </span>
  );
}

"use client";

import { ChevronDown, Check } from "lucide-react";
import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
};

type DropdownProps = {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
};

export function Dropdown({
  label,
  options,
  value,
  onChange,
  icon,
  placeholder = "Select…",
  disabled = false,
  className = "",
  fullWidth = true
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value)
    )
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const initial = Math.max(
        0,
        options.findIndex((option) => option.value === value)
      );
      setActiveIndex(initial);
      // Defer focus to next tick so the list exists.
      requestAnimationFrame(() => {
        const el = listRef.current?.querySelector<HTMLElement>(
          `[data-index="${initial}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
      });
    }
  }, [open, options, value]);

  function handleButtonKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleListKey(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        onChange(option.value);
        close();
      }
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className={`relative ${fullWidth ? "w-full" : "inline-block"} ${className}`}
    >
      {label ? (
        <label className="field-label mb-2 block" htmlFor={`${listId}-button`}>
          {label}
        </label>
      ) : null}
      <button
        ref={buttonRef}
        id={`${listId}-button`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleButtonKey}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm font-medium text-ink shadow-soft transition hover:border-accent focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          open ? "border-accent ring-4 ring-accent/20" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span className="grid h-6 w-6 place-items-center text-accent">{icon}</span>
          ) : null}
          <span className={`truncate ${selected ? "text-ink" : "text-muted"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      <ul
        ref={listRef}
        id={`${listId}-list`}
        role="listbox"
        tabIndex={-1}
        onKeyDown={handleListKey}
        aria-activedescendant={
          open ? `${listId}-option-${activeIndex}` : undefined
        }
        className={`absolute z-50 mt-2 max-h-72 w-full origin-top overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-soft outline-none transition-all duration-200 ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 -translate-y-1"
        }`}
      >
        {options.map((option, index) => {
          const isActive = index === activeIndex;
          const isSelected = option.value === value;
          return (
            <li
              key={option.value}
              id={`${listId}-option-${index}`}
              data-index={index}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                close();
              }}
              className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-accent/15 text-ink"
                  : "text-ink hover:bg-surface-muted"
              } ${open ? "animate-stagger-fade" : ""}`}
              style={open ? { animationDelay: `${index * 30}ms` } : undefined}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              ) : null}
            </li>
          );
        })}
        {options.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted">No options</li>
        ) : null}
      </ul>
    </div>
  );
}

export default Dropdown;

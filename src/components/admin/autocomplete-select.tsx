"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type AutocompleteOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
};

export function AutocompleteSelect({
  label,
  name,
  value,
  options,
  onChange,
  placeholder = "พิมพ์เพื่อค้นหา…",
  required = false,
  disabled = false,
  className = "",
  labelClassName = "text-xs font-medium text-slate-700",
}: {
  label: string;
  name?: string;
  value: string;
  options: readonly AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selected = options.find((option) => option.value === value);
  const validSelection = Boolean(selected);
  const expanded = open && !disabled;
  const words = (query || "")
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const suggestions = options.filter((option) => {
    const text = [option.label, option.description, option.keywords]
      .join(" ")
      .toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
  const active = expanded ? suggestions[activeIndex] : undefined;

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && !validSelection ? "กรุณาเลือกข้อมูลจากรายการแนะนำ" : "",
    );
  }, [required, validSelection]);

  useEffect(() => {
    if (expanded && activeIndex >= 0)
      document
        .getElementById(`${id}-option-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [id, expanded, activeIndex]);

  function close() {
    setOpen(false);
    setQuery(null);
    setActiveIndex(-1);
  }

  function select(option: AutocompleteOption) {
    inputRef.current?.setCustomValidity("");
    onChange(option.value);
    close();
  }

  function keydown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length)
        setActiveIndex(
          !expanded || activeIndex < 0
            ? event.key === "ArrowDown"
              ? 0
              : suggestions.length - 1
            : (activeIndex +
                (event.key === "ArrowDown" ? 1 : -1) +
                suggestions.length) %
                suggestions.length,
        );
    } else if (expanded && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : suggestions.length - 1);
    } else if (expanded && event.key === "Enter") {
      event.preventDefault();
      const option = active || suggestions[0];
      if (option) select(option);
      else inputRef.current?.reportValidity();
    } else if (expanded && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className={`mb-1 block ${labelClassName}`}>
        {label}
      </label>
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) close();
        }}
      >
        {name && (
          <input
            type="hidden"
            name={name}
            value={selected?.value || ""}
            disabled={disabled}
          />
        )}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={expanded}
          aria-controls={expanded ? `${id}-list` : undefined}
          aria-activedescendant={
            active ? `${id}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          required={required}
          disabled={disabled}
          value={expanded && query !== null ? query : selected?.label || ""}
          placeholder={placeholder}
          className="form-input pr-8 disabled:bg-slate-50 disabled:text-slate-400"
          onFocus={(event) => {
            event.target.select();
            setOpen(true);
            setActiveIndex(-1);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={keydown}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
            if (value) onChange("");
            if (required)
              event.currentTarget.setCustomValidity(
                "กรุณาเลือกข้อมูลจากรายการแนะนำ",
              );
          }}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            d="m6 8 4 4 4-4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {expanded && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <ul
              id={`${id}-list`}
              role="listbox"
              aria-label={label}
              className="custom-scroll max-h-60 overflow-y-auto p-1"
            >
              {suggestions.map((option, index) => (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    id={`${id}-option-${index}`}
                    aria-selected={option.value === value}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(option)}
                    onPointerMove={() => setActiveIndex(index)}
                    className={`block w-full rounded-lg px-3 py-2.5 text-left text-xs leading-5 ${activeIndex === index ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className="block">{option.label}</span>
                    {option.description && (
                      <span className="block text-[10px] text-slate-400">
                        {option.description}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {!suggestions.length && (
              <p role="status" className="px-4 py-3 text-xs text-slate-500">
                ไม่พบข้อมูลที่ตรงกับคำค้น
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

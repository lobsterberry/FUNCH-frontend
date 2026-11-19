"use client";

import { useId, useState, type KeyboardEvent } from "react";

export function LocationAutocomplete({
  id,
  name,
  value,
  options,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  name: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim().toLocaleLowerCase();
  const suggestions = options.filter((option) =>
    option.toLocaleLowerCase().includes(query),
  );
  const activeOption = open ? suggestions[activeIndex] : undefined;

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length) {
        const next =
          !open || activeIndex < 0
            ? event.key === "ArrowDown"
              ? 0
              : suggestions.length - 1
            : (activeIndex +
                (event.key === "ArrowDown" ? 1 : -1) +
                suggestions.length) %
              suggestions.length;
        setActiveIndex(next);
      }
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      select(activeOption);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <input
        id={id}
        name={name}
        required
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          activeOption ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={(event) => {
          event.target.select();
          setOpen(true);
          setActiveIndex(-1);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          <ul id={listId} role="listbox" aria-label="เมืองและสนามบินที่แนะนำ">
            {suggestions.map((option, index) => (
              <li key={option} role="presentation">
                <button
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(option)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 ${activeIndex === index ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length === 0 && (
            <p role="status" className="px-3 py-2 text-xs text-slate-500">
              ไม่พบเมืองที่ตรงกับคำค้น คุณสามารถใช้ชื่อสถานที่ที่พิมพ์ได้
            </p>
          )}
        </div>
      )}
    </div>
  );
}

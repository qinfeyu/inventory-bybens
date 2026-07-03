import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;        // main label shown in the dropdown
  sublabel?: string;    // secondary line (e.g. variant / size / stock)
  badge?: string;       // small right-side badge (e.g. "Stock: 3")
  badgeColor?: 'success' | 'warning' | 'danger' | 'secondary';
  disabled?: boolean;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableOption[];
  value: string;                          // currently selected value
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  required = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the display label for the current value
  const selectedOption = options.find(o => o.value === value);

  // Filter options by the search query
  const filtered = options.filter(opt => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel?.toLowerCase().includes(q) ?? false)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    // Focus input on next tick so the dropdown is rendered first
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const handleSelect = (opt: SearchableOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setOpen(false);
    setQuery('');
  };

  const badgeClass: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger:  'badge badge-danger',
    secondary: 'badge badge-secondary',
  };

  return (
    <div
      ref={containerRef}
      className={`ss-container ${className}`}
      style={{ position: 'relative' }}
    >
      {/* Trigger button — shows selected label or placeholder */}
      <button
        id={id}
        type="button"
        className="ss-trigger form-control"
        onClick={open ? () => { setOpen(false); setQuery(''); } : handleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selectedOption ? 'ss-trigger-label' : 'ss-trigger-placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="ss-trigger-icons">
          {value && (
            <span
              className="ss-clear-btn"
              onClick={handleClear}
              title="Clear"
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleClear(e as any)}
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`ss-chevron ${open ? 'ss-chevron-up' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="ss-dropdown" role="listbox">
          {/* Search input inside dropdown */}
          <div className="ss-search-row">
            <Search size={14} className="ss-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="ss-search-input"
              placeholder="Type to search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                className="ss-search-clear"
                onClick={() => setQuery('')}
                tabIndex={-1}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Option list */}
          <ul className="ss-option-list">
            {!required && (
              <li
                className={`ss-option ss-option-empty ${!value ? 'ss-option-selected' : ''}`}
                onClick={() => handleSelect({ value: '', label: placeholder })}
                role="option"
              >
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{placeholder}</span>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="ss-option-none">No results for "{query}"</li>
            ) : (
              filtered.map(opt => (
                <li
                  key={opt.value}
                  className={`ss-option ${opt.value === value ? 'ss-option-selected' : ''} ${opt.disabled ? 'ss-option-disabled' : ''}`}
                  onClick={() => handleSelect(opt)}
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                >
                  <span className="ss-option-body">
                    <span className="ss-option-label">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="ss-option-sublabel">{opt.sublabel}</span>
                    )}
                  </span>
                  {opt.badge && (
                    <span className={badgeClass[opt.badgeColor ?? 'secondary']}>
                      {opt.badge}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Hidden native input so form validation / required works */}
      <input
        type="text"
        value={value}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        aria-hidden
      />
    </div>
  );
};

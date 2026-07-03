import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  value: string;
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
  // Portal dropdown position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive the display label for the current value
  const selectedOption = options.find(o => o.value === value);

  // Filter options by the search query
  const filtered = query
    ? options.filter(opt => {
        const q = query.toLowerCase();
        return (
          opt.label.toLowerCase().includes(q) ||
          (opt.sublabel?.toLowerCase().includes(q) ?? false)
        );
      })
    : options;

  // Calculate and set dropdown position relative to trigger button
  const positionDropdown = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // On mobile: fixed panel just above the bottom navigation
      const bottomNavHeight = 72;
      setDropdownStyle({
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: bottomNavHeight + 8,
        zIndex: 9999,
      });
    } else {
      // On desktop: anchor below the trigger
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownMaxH = 300;
      const showAbove = spaceBelow < dropdownMaxH && rect.top > dropdownMaxH;

      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
  };

  const handleOpen = () => {
    positionDropdown();
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (opt: SearchableOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    handleClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    handleClose();
  };

  // Close on outside click (covers both trigger and portal dropdown)
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      handleClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => positionDropdown();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const badgeClass: Record<string, string> = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    secondary: 'badge badge-secondary',
  };

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      className="ss-dropdown"
      style={dropdownStyle}
      role="listbox"
    >
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
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {placeholder}
            </span>
          </li>
        )}
        {filtered.length === 0 ? (
          <li className="ss-option-none">
            {query ? `No results for "${query}"` : 'No options available'}
          </li>
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
  ) : null;

  return (
    <div className={`ss-container ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="ss-trigger form-control"
        onClick={open ? handleClose : handleOpen}
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
          <ChevronDown
            size={15}
            className={`ss-chevron ${open ? 'ss-chevron-up' : ''}`}
          />
        </span>
      </button>

      {/* Render dropdown via portal — escapes any overflow/stacking-context clipping */}
      {ReactDOM.createPortal(dropdown, document.body)}

      {/* Hidden native input for form required validation */}
      <input
        type="text"
        value={value}
        required={required}
        onChange={() => {}}
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          height: 0,
          width: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      />
    </div>
  );
};
